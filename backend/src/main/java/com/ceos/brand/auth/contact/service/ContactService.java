package com.ceos.brand.auth.contact.service;

import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.auth.service.AuthService;
import com.ceos.brand.auth.common.ApiException;
import com.ceos.brand.auth.contact.dto.ContactRequest;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class ContactService {

    private static final String CONTACT_DESTINATION = "ceos5oficial@gmail.com";

    private final JavaMailSender mailSender;
    private final AuthService authService;
    private final String mailUsername;

    public ContactService(
        JavaMailSender mailSender,
        AuthService authService,
        @Value("${spring.mail.username:}") String mailUsername
    ) {
        this.mailSender = mailSender;
        this.authService = authService;
        this.mailUsername = mailUsername;
    }

    public void sendContactEmail(ContactRequest request, HttpSession session) {
        User user = authService.getCurrentUserEntity(session);

        if (mailUsername == null || mailUsername.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "El correo de contacto no esta configurado.");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(mailUsername);
            helper.setTo(CONTACT_DESTINATION);
            helper.setReplyTo(request.email().trim());
            helper.setSubject("[CEOS Contacto] " + request.subject().trim());
            helper.setText(buildBody(request, user), true);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "No se pudo enviar el mensaje. Intentalo mas tarde.");
        }
    }

    private String buildBody(ContactRequest request, User user) {
        String name = escapeHtml(request.name().trim());
        String email = escapeHtml(request.email().trim());
        String subject = escapeHtml(request.subject().trim());
        String message = escapeHtml(request.message().trim()).replace("\n", "<br>");
        String userName = escapeHtml(user.name());
        String userEmail = escapeHtml(user.email());

        return """
            <!doctype html>
            <html>
              <body style="margin:0;background:#f3f3f3;padding:28px;font-family:Arial,Helvetica,sans-serif;color:#161616;">
                <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e7e7e7;">
                  <div style="background:#0d0d0f;color:#ffffff;padding:28px 32px;">
                    <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#cdb27b;font-weight:700;">CEOS BRAND</div>
                    <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;">Nuevo mensaje de contacto</h1>
                  </div>

                  <div style="padding:30px 32px;">
                    <div style="padding:18px 20px;background:#f7f7f7;border-radius:14px;margin-bottom:22px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#777;font-weight:700;margin-bottom:8px;">Asunto</div>
                      <div style="font-size:20px;font-weight:800;color:#111;">%s</div>
                    </div>

                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;">
                      <tr>
                        <td style="width:50%%;padding:14px 16px;background:#fafafa;border-radius:12px;border:1px solid #eeeeee;">
                          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#777;font-weight:700;">Nombre</div>
                          <div style="margin-top:6px;font-size:16px;font-weight:700;">%s</div>
                        </td>
                        <td style="width:14px;"></td>
                        <td style="width:50%%;padding:14px 16px;background:#fafafa;border-radius:12px;border:1px solid #eeeeee;">
                          <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#777;font-weight:700;">Responder a</div>
                          <a href="mailto:%s" style="display:block;margin-top:6px;color:#111;font-size:16px;font-weight:700;">%s</a>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-bottom:22px;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#777;font-weight:700;margin-bottom:10px;">Mensaje</div>
                      <div style="padding:20px;background:#fff;border:1px solid #e8e8e8;border-radius:14px;font-size:16px;line-height:1.7;color:#222;">%s</div>
                    </div>

                    <a href="mailto:%s" style="display:inline-block;background:#0d0d0f;color:#ffffff;text-decoration:none;border-radius:999px;padding:13px 20px;font-weight:800;">Responder mensaje</a>

                    <div style="margin-top:26px;padding-top:18px;border-top:1px solid #eeeeee;color:#666;font-size:13px;line-height:1.6;">
                      <strong>Usuario conectado:</strong><br>
                      %s · %s
                    </div>
                  </div>
                </div>
              </body>
            </html>
            """.formatted(
            subject,
            name,
            email,
            email,
            message,
            email,
            userName,
            userEmail
        );
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
