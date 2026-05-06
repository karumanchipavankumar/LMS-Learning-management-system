package com.oryfolks.lms_backend.service;

import com.azure.identity.ClientSecretCredential;
import com.azure.identity.ClientSecretCredentialBuilder;
import com.microsoft.graph.models.BodyType;
import com.microsoft.graph.models.EmailAddress;
import com.microsoft.graph.models.ItemBody;
import com.microsoft.graph.models.Message;
import com.microsoft.graph.models.Recipient;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import com.microsoft.graph.users.item.sendmail.SendMailPostRequestBody; // v6 specific
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.util.Collections;
import java.util.LinkedList;
import java.util.List;

@Service
public class EmailService {

    @Value("${azure.activedirectory.tenant-id}")
    private String tenantId;

    @Value("${azure.activedirectory.client-id}")
    private String clientId;

    @Value("${azure.activedirectory.client-secret}")
    private String clientSecret;

    @Value("${azure.activedirectory.sender-email}")
    private String senderEmail;

    private GraphServiceClient graphClient;

    @PostConstruct
    public void init() {
        try {
            // v6: Directly pass TokenCredential to GraphServiceClient constructor
            ClientSecretCredential credential = new ClientSecretCredentialBuilder()
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .tenantId(tenantId)
                    .build();

            graphClient = new GraphServiceClient(credential, "https://graph.microsoft.com/.default");

            System.out.println("EmailService: GraphServiceClient (v6) initialized successfully.");
        } catch (Exception e) {
            System.err.println("EmailService: Failed to initialize GraphServiceClient: " + e.getMessage());
        }
    }

    public void sendWelcomeEmail(String to, String firstName, String username, String initialPassword, String resetLink) {
        System.out.println("EmailService: sendWelcomeEmail requested for " + to);
        String subject = "Welcome to Oryfolks LMS!";
        String bodyContent = "Dear " + firstName + ",<br/><br/>" +
                "Welcome to the Oryfolks Learning Management System!<br/><br/>" +
                "Here are your login details:<br/>" +
                "<strong>Username:</strong> " + username + "<br/>" +
                "<strong>Password:</strong> " + initialPassword + "<br/><br/>" +
                "Please login and change your password immediately. You can set a new password by clicking the link below:<br/>" +
                "<a href='" + resetLink + "'>Set Your Password</a><br/><br/>" +
                "Best Regards,<br/>" +
                "Oryfolks LMS Team";

        sendEmail(to, subject, bodyContent);
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        String subject = "Password Reset Request - Oryfolks LMS";
        String bodyContent = "Dear User,<br/><br/>" +
                "You have requested to reset your password.<br/><br/>" +
                "Click the link below to reset it:<br/>" +
                "<a href='" + resetLink + "'>Reset Password</a><br/><br/>" +
                "If you did not request this, please ignore this email.<br/><br/>" +
                "Best Regards,<br/>" +
                "Oryfolks LMS Team";

        sendEmail(to, subject, bodyContent);
    }

    public void sendCourseReminder(String to, String employeeName, String courseName, LocalDate deadline,
            Integer progress) {
        String subject = "Reminder: Course Deadline Approaching - " + courseName;
        String bodyContent = "Hi " + employeeName + ",<br/><br/>" +
                "This is a friendly reminder regarding your assigned course: <strong>" + courseName
                + "</strong>.<br/><br/>" +
                "Current Progress: " + progress + "%<br/>" +
                "Deadline: " + deadline + "<br/><br/>" +
                "Please ensure you complete the course on time.<br/><br/>" +
                "Best Regards,<br/>" +
                "Your Manager";

        sendEmail(to, subject, bodyContent);
    }

    private void sendEmail(String to, String subject, String bodyContent) {
        if (graphClient == null) {
            System.err.println("EmailService: Graph client is not initialized. Cannot send email.");
            return;
        }

        try {
            // v6: SendMailPostRequestBody is used instead of passing Message object
            // directly to sendMail
            SendMailPostRequestBody sendMailPostRequestBody = new SendMailPostRequestBody();

            Message message = new Message();
            message.setSubject(subject); // v6 uses setters often, but public fields might remain. Using setters is
                                         // safer.
            // Wait, v6 generated models usually use setters. Let's check.
            // Actually v6 models have public fields but setters are 'setSubject'.

            ItemBody body = new ItemBody();
            body.setContentType(BodyType.Html); // Enum case might differ? v6 uses BodyType.Html
            body.setContent(bodyContent);
            message.setBody(body);

            LinkedList<Recipient> toRecipientsList = new LinkedList<Recipient>();
            Recipient toRecipients = new Recipient();
            EmailAddress emailAddress = new EmailAddress();
            emailAddress.setAddress(to);
            toRecipients.setEmailAddress(emailAddress);
            toRecipientsList.add(toRecipients);
            message.setToRecipients(toRecipientsList);

            sendMailPostRequestBody.setMessage(message);
            sendMailPostRequestBody.setSaveToSentItems(false);

            // v6 Fluent API: users().byUserId(id).sendMail().post(body)
            graphClient.users().byUserId(senderEmail).sendMail().post(sendMailPostRequestBody);

            System.out.println("EmailService: Email sent successfully to " + to + " via Microsoft Graph API v6.");

        } catch (Exception e) {
            System.err.println("CRITICAL: EmailService failed to send email to " + to);
            System.err.println("Sender: " + senderEmail);
            System.err.println("Exception Type: " + e.getClass().getName());
            System.err.println("Error Message: " + e.getMessage());

            // Print full stack trace to the console for deep debugging
            e.printStackTrace();

            if (e.getCause() != null) {
                System.err.println("Root Cause: " + e.getCause().getMessage());
            }
        }
    }
}
