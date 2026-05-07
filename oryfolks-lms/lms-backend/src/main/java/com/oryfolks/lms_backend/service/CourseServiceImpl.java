package com.oryfolks.lms_backend.service;

import com.oryfolks.lms_backend.DTO.CourseRequestDTO;
import com.oryfolks.lms_backend.DTO.CourseResponseDTO;
import com.oryfolks.lms_backend.DTO.CourseEnrollmentDTO;
import com.oryfolks.lms_backend.DTO.CourseContentDTO;

import com.oryfolks.lms_backend.entity.Course;
import com.oryfolks.lms_backend.entity.CourseVideo;
import com.oryfolks.lms_backend.entity.CourseContent;
import com.oryfolks.lms_backend.entity.EmployeeContentProgress;
import com.oryfolks.lms_backend.repository.CourseRepository;
import com.oryfolks.lms_backend.repository.CourseVideoRepository;
import com.oryfolks.lms_backend.repository.CourseContentRepository;
import com.oryfolks.lms_backend.repository.EmployeeContentProgressRepository;
import com.oryfolks.lms_backend.repository.EmployeeCourseRepository;
import com.oryfolks.lms_backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class CourseServiceImpl implements CourseService {

        @Autowired
        private CourseRepository courseRepository;

        @Autowired
        private CourseVideoRepository courseVideoRepository;

        @Autowired
        private S3Service s3Service;

        @Autowired
        private EmployeeCourseRepository employeeCourseRepository;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private com.oryfolks.lms_backend.repository.CourseRatingRepository courseRatingRepository;

        @Autowired
        private com.oryfolks.lms_backend.repository.CourseEnrollmentRepository courseEnrollmentRepository;

        @Autowired
        private CourseContentRepository courseContentRepository;

        @Autowired
        private EmployeeContentProgressRepository employeeContentProgressRepository;

        @Override
        public void createCourse(CourseRequestDTO dto,
                        MultipartFile thumbnail,
                        MultipartFile video) {

                // Upload thumbnail
                String thumbnailUrl = s3Service.uploadFile(
                                thumbnail,
                                "course-thumbnails/" + UUID.randomUUID());

                // Save course
                Course course = new Course();
                course.setTitle(dto.getTitle());
                course.setCategory(dto.getCategory());
                course.setDescription(dto.getDescription());
                course.setDuration(dto.getDuration());
                course.setThumbnailUrl(thumbnailUrl);

                Course savedCourse = courseRepository.save(course);

                // Upload video
                String videoUrl = s3Service.uploadFile(
                                video,
                                "course-videos/" + UUID.randomUUID());

                // Save video
                CourseVideo courseVideo = new CourseVideo();
                courseVideo.setVideoTitle(dto.getTitle() + " - Intro");
                courseVideo.setVideoUrl(videoUrl);
                courseVideo.setCourse(savedCourse);

                // Video Content Extraction (Structured Parsing)
                String videoContents = dto.getContents();
                courseVideoRepository.save(courseVideo); // Save first to get ID

                if (videoContents != null && !videoContents.isBlank()) {
                        parseAndSaveContents(videoContents, courseVideo);
                }
        }

        private void parseAndSaveContents(String contentStr, CourseVideo video) {
                String[] lines = contentStr.split("\n");
                StringBuilder cleanedContents = new StringBuilder();
                
                for (String line : lines) {
                        if (line == null || line.isBlank())
                                continue;
                        
                        ParsedContent parsed = parseContentLine(line);

                        CourseContent content = new CourseContent();
                        content.setTitle(parsed.title);
                        content.setTimestamp(parsed.timestamp);
                        content.setCourseVideo(video);
                        courseContentRepository.save(content);

                        // Add to cleaned bulk content
                        cleanedContents.append(parsed.title).append("\n");
                }
                
                // Update the CourseVideo with the cleaned contents string
                video.setContents(cleanedContents.toString().trim());
                courseVideoRepository.save(video);
                courseContentRepository.flush();
        }

        private ParsedContent parseContentLine(String line) {
                String trimmedLine = line.trim();
                String title = trimmedLine;
                double totalSeconds = 0.0;
                boolean timeFound = false;

                // Match timestamps like HH:MM:SS, MM:SS, or M:SS anywhere in the line.
                java.util.regex.Pattern timePattern = java.util.regex.Pattern.compile("(?:([0-9]{1,2}):)?([0-9]{1,2}):([0-9]{2})");
                java.util.regex.Matcher matcher = timePattern.matcher(trimmedLine);

                if (matcher.find()) {
                    timeFound = true;
                    String hoursStr = matcher.group(1);
                    String minutesStr = matcher.group(2);
                    String secondsStr = matcher.group(3);

                    int hours = (hoursStr != null) ? Integer.parseInt(hoursStr) : 0;
                    int minutes = Integer.parseInt(minutesStr);
                    int seconds = Integer.parseInt(secondsStr);

                    totalSeconds = (hours * 3600.0) + (minutes * 60.0) + seconds;

                    // Remove the timestamp from the line
                    title = trimmedLine.replace(matcher.group(0), "");
                }

                // Aggressively clean the title:
                // 1. Remove common separators and extra whitespace
                title = title.replaceAll("\\s*[-–—|:]+\\s*", " ");
                // 2. Remove any non-alphanumeric prefixes (emojis like ✅, sequence symbols, etc.)
                title = title.replaceFirst("^[^a-zA-Z0-9]+", "");
                // 3. Remove leading sequence numbers specifically (e.g., "1. Title", "01 title")
                title = title.replaceFirst("^(?:\\d+[.\\s-]+\\s*)", "");
                // 4. Final trim and space collapse
                title = title.replaceAll("\\s+", " ").trim();

                ParsedContent result = new ParsedContent();
                result.title = title;
                result.timestamp = totalSeconds;
                result.timeFound = timeFound;
                return result;
        }

        private static class ParsedContent {
                String title;
                double timestamp;
                boolean timeFound;
        }

        @Override
        public List<CourseResponseDTO> getAllCourses() {

                return courseRepository.findAll()
                                .stream()
                                .map(course -> {

                                        long employeeCount = employeeCourseRepository.countByCourseId(course.getId());
                                        Double avgRating = courseRatingRepository.getAverageRating(course.getId());
                                        Long ratingCount = courseRatingRepository.getRatingCount(course.getId());

                                        return new CourseResponseDTO(
                                                        course.getId(),
                                                        course.getTitle(),
                                                        course.getCategory(),
                                                        course.getDuration(),
                                                        course.getThumbnailUrl(),
                                                        course.getCreatedDate(),
                                                        employeeCount,
                                                        course.getDescription(),
                                                        0, // No progress for public view
                                                        null, // No video URL for public view
                                                        null, // No timestamp
                                                        avgRating != null ? avgRating : 0.0,
                                                        ratingCount != null ? ratingCount.intValue() : 0,
                                                        null, // No deadline for public view
                                                        null, // No enrollmentType
                                                        null); // No contents for list view
                                })
                                .toList();
        }

        private Long getLoggedInEmployeeId() {

                Object principal = SecurityContextHolder
                                .getContext()
                                .getAuthentication()
                                .getPrincipal();

                String username;

                if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
                        username = userDetails.getUsername();
                } else {
                        username = principal.toString();
                }

                return userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("User not found"))
                                .getId();
        }

        @Override
        public List<CourseResponseDTO> getMyCourses() {

                Long employeeId = getLoggedInEmployeeId();

                return employeeCourseRepository
                                .findByEmployeeId(employeeId)
                                .stream()
                                .map(employeeCourse -> {

                                        Course course = courseRepository
                                                        .findById(Objects.requireNonNull(employeeCourse.getCourseId()))
                                                        .orElseThrow(() -> new RuntimeException("Course not found"));

                                        long employeeCount = employeeCourseRepository
                                                        .countByCourseId(course.getId());
                                        Double avgRating = courseRatingRepository.getAverageRating(course.getId());
                                        Long ratingCount = courseRatingRepository.getRatingCount(course.getId());

                                        return new CourseResponseDTO(
                                                        course.getId(),
                                                        course.getTitle(),
                                                        course.getCategory(),
                                                        course.getDuration(),
                                                        course.getThumbnailUrl(),
                                                        course.getCreatedDate(),
                                                        employeeCount,
                                                        course.getDescription(),
                                                        employeeCourse.getProgress(),
                                                        null, // No video URL needed for list
                                                        employeeCourse.getLastWatchedTimestamp(),
                                                        avgRating != null ? avgRating : 0.0,
                                                        ratingCount != null ? ratingCount.intValue() : 0,
                                                        employeeCourse.getDeadline(),
                                                        employeeCourse.getEnrollmentType(),
                                                        null); // Contents not typically needed for the "My Courses"
                                                               // list
                                })
                                .toList();
        }

        @Override
        @Transactional
        public CourseResponseDTO getCourseById(Long courseId) {
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new RuntimeException("Course not found"));

                long employeeCount = employeeCourseRepository.countByCourseId(courseId);

                // Fetch video details directly for this specific course via a proper DB query.
                // FIXED: The previous courseVideoRepository.findAll().stream().filter(...) pattern was
                // loading ALL videos into memory, and Hibernate's lazy-loading proxy was causing the
                // same cached course object to be returned for every video, making every course show
                // identical contents.
                CourseVideo video = courseVideoRepository.findByCourseId(courseId).orElse(null);

                String videoUrl = (video != null) ? video.getVideoUrl() : null;
                List<CourseContentDTO> contentDTOs = new java.util.ArrayList<>();

                Long employeeId = null;
                try {
                        employeeId = getLoggedInEmployeeId();
                } catch (Exception e) {}

                if (video != null) {
                        final Long finalEmpId = employeeId;
                        List<CourseContent> contents = courseContentRepository.findByCourseVideoIdOrderByTimestampAsc(video.getId());
                        contentDTOs = contents.stream().map(c -> {
                                boolean isCompleted = false;
                                if (finalEmpId != null) {
                                        isCompleted = employeeContentProgressRepository
                                                        .findByEmployeeIdAndContentId(finalEmpId, c.getId())
                                                        .map(EmployeeContentProgress::isCompleted)
                                                        .orElse(false);
                                }
                                
                                // Dynamic fix for existing data: clean title and fix timestamp if needed
                                String displayTitle = c.getTitle();
                                Double displayTimestamp = c.getTimestamp();
                                
                                if (displayTitle != null && !displayTitle.isBlank()) {
                                        ParsedContent pc = parseContentLine(displayTitle);
                                        displayTitle = pc.title;
                                        // If the stored timestamp is 0 or potentially wrong, use the parsed one
                                        if (pc.timeFound && (displayTimestamp == null || displayTimestamp == 0.0)) {
                                                displayTimestamp = pc.timestamp;
                                        }
                                }
                                
                                return new CourseContentDTO(c.getId(), displayTitle, displayTimestamp, isCompleted);
                        }).collect(java.util.stream.Collectors.toList());

                        // FALLBACK: If no structured contents exist, try to promote the legacy text field.
                        // CRITICAL: Only run parseAndSaveContents if contents are truly empty in the DB.
                        // Without this guard, it runs on every page view and creates endless duplicate rows.
                        if (contentDTOs.isEmpty() && video.getContents() != null && !video.getContents().isBlank()) {
                                // Double-check the DB to be absolutely sure no rows exist for this video
                                long existingCount = courseContentRepository.countByCourseVideoId(video.getId());
                                if (existingCount == 0) {
                                        // Safe to promote legacy text contents into structured rows
                                        parseAndSaveContents(video.getContents(), video);
                                        // Re-fetch newly created contents
                                        contents = courseContentRepository.findByCourseVideoIdOrderByTimestampAsc(video.getId());
                                        contentDTOs = contents.stream().map(c -> {
                                                boolean isCompleted = false;
                                                if (finalEmpId != null) {
                                                        isCompleted = employeeContentProgressRepository
                                                                        .findByEmployeeIdAndContentId(finalEmpId, c.getId())
                                                                        .map(EmployeeContentProgress::isCompleted)
                                                                        .orElse(false);
                                                }
                                                String displayTitle = c.getTitle();
                                                Double displayTimestamp = c.getTimestamp();
                                                if (displayTitle != null && !displayTitle.isBlank()) {
                                                        ParsedContent pc = parseContentLine(displayTitle);
                                                        displayTitle = pc.title;
                                                        if (pc.timeFound && (displayTimestamp == null || displayTimestamp == 0.0)) {
                                                                displayTimestamp = pc.timestamp;
                                                        }
                                                }
                                                return new CourseContentDTO(c.getId(), displayTitle, displayTimestamp, isCompleted);
                                        }).collect(java.util.stream.Collectors.toList());
                                }
                        }
                }

                int progress = 0;
                Double lastWatchedTimestamp = 0.0;
                LocalDate deadline = null;
                try {
                        employeeId = getLoggedInEmployeeId();
                        Optional<com.oryfolks.lms_backend.entity.EmployeeCourse> employeeCourseOpt = employeeCourseRepository
                                        .findByEmployeeIdAndCourseId(employeeId, courseId);

                        if (employeeCourseOpt.isPresent()) {
                                com.oryfolks.lms_backend.entity.EmployeeCourse ec = employeeCourseOpt.get();
                                progress = ec.getProgress();
                                lastWatchedTimestamp = ec.getLastWatchedTimestamp();
                                deadline = ec.getDeadline();
                        }
                } catch (Exception e) {
                        // Ignore if not logged in or user not found (though should be authenticated)
                }

                Double avgRating = courseRatingRepository.getAverageRating(courseId);
                Long ratingCount = courseRatingRepository.getRatingCount(courseId);

                return new CourseResponseDTO(
                                course.getId(),
                                course.getTitle(),
                                course.getCategory(),
                                course.getDuration(),
                                course.getThumbnailUrl(),
                                course.getCreatedDate(),
                                employeeCount,
                                course.getDescription(),
                                progress,
                                videoUrl,
                                lastWatchedTimestamp,
                                avgRating != null ? avgRating : 0.0,
                                ratingCount != null ? ratingCount.intValue() : 0,
                                deadline,
                                null,
                                contentDTOs);
        }

        @Override
        public void updateCourseProgress(Long courseId, int progress, Double lastWatchedTimestamp) {
                Long employeeId = getLoggedInEmployeeId();
                com.oryfolks.lms_backend.entity.EmployeeCourse employeeCourse = employeeCourseRepository
                                .findByEmployeeIdAndCourseId(employeeId, courseId)
                                .orElseThrow(() -> new RuntimeException("Course assignment not found"));

                // Always update timestamp if provided
                if (lastWatchedTimestamp != null) {
                        employeeCourse.setLastWatchedTimestamp(lastWatchedTimestamp);
                }

                // Lock progress if already completed
                if ("COMPLETED".equals(employeeCourse.getStatus()) || employeeCourse.getProgress() == 100) {
                        employeeCourseRepository.save(employeeCourse); // Save timestamp only
                        return;
                }

                int finalProgress = Math.min(progress, 100);

                employeeCourse.setProgress(finalProgress);

                if (finalProgress == 100) {
                        employeeCourse.setStatus("COMPLETED");
                } else if (finalProgress > 0) {
                        employeeCourse.setStatus("IN_PROGRESS");
                }
                employeeCourseRepository.save(employeeCourse);
        }

        @Override
        public void deleteCourse(Long id) {
                if (id == null) {
                        throw new IllegalArgumentException("Course ID cannot be null");
                }

                System.out.println("CourseServiceImpl: Starting thorough deletion for course ID: " + id);

                // 1. Delete course assignments
                employeeCourseRepository.deleteByCourseId(id);
                System.out.println("CourseServiceImpl: Deleted course assignments.");

                // 2. Delete course ratings
                courseRatingRepository.deleteByCourseId(id);
                System.out.println("CourseServiceImpl: Deleted course ratings.");

                // 3. Delete course enrollments
                courseEnrollmentRepository.deleteByCourseId(id);
                System.out.println("CourseServiceImpl: Deleted course enrollment requests.");

                // 4. Delete intro videos (queried directly by courseId instead of filtering all in memory)
                courseVideoRepository.findByCourseId(id).ifPresent(courseVideoRepository::delete);
                System.out.println("CourseServiceImpl: Deleted course videos.");

                // 5. Finally delete the course
                courseRepository.deleteById(id);
                System.out.println("CourseServiceImpl: Deleted course record.");
        }

        @Override
        public void requestEnrollment(Long courseId) {
                if (courseId == null) {
                        throw new IllegalArgumentException("Course ID cannot be null");
                }
                Long employeeId = getLoggedInEmployeeId();

                // Check if course exists
                if (!courseRepository.existsById(courseId)) {
                        throw new RuntimeException("Course not found");
                }

                // Check if already assigned
                if (employeeCourseRepository.findByEmployeeIdAndCourseId(employeeId, courseId).isPresent()) {
                        throw new RuntimeException("Course already assigned");
                }

                // Check if already pending or rejected
                Optional<com.oryfolks.lms_backend.entity.CourseEnrollment> existingEnrollmentOpt = courseEnrollmentRepository
                                .findByEmployeeIdAndCourseId(employeeId, courseId);

                if (existingEnrollmentOpt.isPresent()) {
                        com.oryfolks.lms_backend.entity.CourseEnrollment existingEnrollment = existingEnrollmentOpt
                                        .get();
                        if ("PENDING".equals(existingEnrollment.getStatus())) {
                                throw new RuntimeException("Enrollment request already pending");
                        } else if ("REJECTED".equals(existingEnrollment.getStatus())) {
                                // Re-open request
                                existingEnrollment.setStatus("PENDING");
                                existingEnrollment.setRequestDate(java.time.LocalDateTime.now());
                                courseEnrollmentRepository.save(existingEnrollment);
                                return;
                        } else if ("APPROVED".equals(existingEnrollment.getStatus())) {
                                throw new RuntimeException("Course already assigned");
                        }
                }

                com.oryfolks.lms_backend.entity.CourseEnrollment enrollment = new com.oryfolks.lms_backend.entity.CourseEnrollment();
                enrollment.setCourseId(courseId);
                enrollment.setEmployeeId(employeeId);
                enrollment.setStatus("PENDING");
                enrollment.setRequestDate(java.time.LocalDateTime.now());

                courseEnrollmentRepository.save(enrollment);
        }

        @Override
        public List<CourseEnrollmentDTO> getEnrollmentHistory() {
                Long employeeId = getLoggedInEmployeeId();

                return courseEnrollmentRepository.findByEmployeeId(employeeId).stream()
                                .map(enrollment -> {
                                        Long cId = enrollment.getCourseId();
                                        Course course = (cId != null) ? courseRepository.findById(cId).orElse(null)
                                                        : null;
                                        String courseName = course != null ? course.getTitle() : "Unknown Course";
                                        String category = course != null ? course.getCategory() : "Unknown";

                                        return new CourseEnrollmentDTO(
                                                        enrollment.getId(),
                                                        enrollment.getCourseId(),
                                                        courseName,
                                                        category,
                                                        enrollment.getEmployeeId(),
                                                        null, // Employee Name not needed for self view
                                                        enrollment.getStatus(),
                                                        enrollment.getRequestDate(),
                                                        enrollment.getResponseDate(),
                                                        course != null ? course.getThumbnailUrl() : null,
                                                        course != null ? course.getDuration() : "N/A",
                                                        course != null ? course.getDescription() : "No description");
                                })
                                .toList();
        }

        @Override
        @Transactional
        public void markContentAsCompleted(Long contentId) {
                Long employeeId = getLoggedInEmployeeId();
                EmployeeContentProgress progress = employeeContentProgressRepository
                                .findByEmployeeIdAndContentId(employeeId, contentId)
                                .orElseGet(() -> {
                                        EmployeeContentProgress newProgress = new EmployeeContentProgress();
                                        newProgress.setEmployeeId(employeeId);
                                        newProgress.setContentId(contentId);
                                        return newProgress;
                                });

                progress.setCompleted(true);
                employeeContentProgressRepository.saveAndFlush(progress);
        }
}
