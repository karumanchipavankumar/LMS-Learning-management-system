package com.oryfolks.lms_backend.controller;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import jakarta.servlet.http.HttpServletRequest;
import java.io.InputStream;

@RestController
@RequestMapping("/media")
public class MediaController {

    private final AmazonS3 amazonS3;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    public MediaController(AmazonS3 amazonS3) {
        this.amazonS3 = amazonS3;
    }

    @GetMapping("/**")
    public ResponseEntity<StreamingResponseBody> streamMedia(
            HttpServletRequest request,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {

        String path = request.getRequestURI();
        String key = path.substring(path.indexOf("/media/") + 7);
        if (key.startsWith("/")) {
            key = key.substring(1);
        }

        try {
            GetObjectRequest getObjectRequest = new GetObjectRequest(bucketName, key);

            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                String[] ranges = rangeHeader.substring(6).split("-");
                long start = Long.parseLong(ranges[0]);
                long end = ranges.length > 1 && !ranges[1].isEmpty() ? Long.parseLong(ranges[1]) : -1;

                if (end != -1) {
                    getObjectRequest.setRange(start, end);
                } else {
                    getObjectRequest.setRange(start);
                }
            }

            S3Object s3Object = amazonS3.getObject(getObjectRequest);
            S3ObjectInputStream inputStream = s3Object.getObjectContent();

            long contentLength = s3Object.getObjectMetadata().getContentLength();
            String contentType = s3Object.getObjectMetadata().getContentType();
            if (contentType == null) {
                if (key.endsWith(".mp4")) contentType = "video/mp4";
                else if (key.endsWith(".jpg") || key.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (key.endsWith(".png")) contentType = "image/png";
                else contentType = "application/octet-stream";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.CONTENT_TYPE, contentType);
            headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");

            HttpStatus status = HttpStatus.OK;

            if (rangeHeader != null) {
                status = HttpStatus.PARTIAL_CONTENT;
                headers.set(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength));
                if (s3Object.getObjectMetadata().getRawMetadata().containsKey("Content-Range")) {
                    headers.set(HttpHeaders.CONTENT_RANGE, String.valueOf(s3Object.getObjectMetadata().getRawMetadata().get("Content-Range")));
                }
            } else {
                headers.set(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength));
            }

            StreamingResponseBody responseBody = outputStream -> {
                try (InputStream is = inputStream) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = is.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                    outputStream.flush();
                }
            };

            return new ResponseEntity<>(responseBody, headers, status);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
