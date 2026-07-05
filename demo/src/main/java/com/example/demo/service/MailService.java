package com.example.demo.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    public void sendActivationMail(String to, String nickname, String activationLink) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("SMTP is not configured. Activation link for {}: {}", to, activationLink);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom == null || mailFrom.isBlank() ? null : mailFrom);
        message.setTo(to);
        message.setSubject("Quju account activation");
        message.setText("Hi " + nickname + ",\n\n"
                + "Please open this link to activate your Quju account:\n"
                + activationLink + "\n\n"
                + "This link expires in 24 hours.");
        mailSender.send(message);
    }
}
