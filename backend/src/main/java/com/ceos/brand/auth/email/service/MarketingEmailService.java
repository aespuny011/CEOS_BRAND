package com.ceos.brand.auth.email.service;

import com.ceos.brand.auth.auth.model.User;
import com.ceos.brand.auth.product.model.Product;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MarketingEmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MarketingEmailService.class);
    private static final String WELCOME_HERO_CONTENT_ID = "welcome-hero";
    private static final String WELCOME_HERO_RESOURCE = "email/welcome-hero.jpg";
    private static final String CEOS_CONTACT_EMAIL = "ceos5oficial@gmail.com";

    private final JavaMailSender mailSender;
    private final String mailUsername;
    private final String frontendBaseUrl;

    public MarketingEmailService(
        JavaMailSender mailSender,
        @Value("${spring.mail.username:}") String mailUsername,
        @Value("${ceos.frontend.base-url:http://localhost:4200}") String frontendBaseUrl
    ) {
        this.mailSender = mailSender;
        this.mailUsername = mailUsername;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public void sendWelcomeEmail(User user) {
        if (!isMailConfigured()) {
            LOGGER.warn("Welcome email skipped for {} because CEOS_MAIL_USERNAME is not configured.", user.email());
            return;
        }

        sendWelcomeEmail(
            user.email(),
            "Bienvenido a CEOS Brand",
            buildWelcomeBody(user)
        );
    }

    public void sendProductLaunchedEmail(Product product, List<User> users) {
        sendProductEmail(
            product,
            users,
            "Nuevo lanzamiento en CEOS Brand: " + product.name(),
            buildProductLaunchBody(product),
            "launch"
        );
    }

    public void sendProductRestockedEmail(Product product, List<User> users) {
        sendProductEmail(
            product,
            users,
            "Vuelve el stock en CEOS Brand: " + product.name(),
            buildProductRestockBody(product),
            "restock"
        );
    }

    public void sendProductAnnouncedEmail(Product product, List<User> users) {
        sendProductEmail(
            product,
            users,
            "Nuevo anuncio en CEOS Brand: " + product.name(),
            buildProductAnnouncementSoonBody(product),
            "coming-soon"
        );
    }

    private void sendProductEmail(Product product, List<User> users, String subject, String body, String emailType) {
        if (!isMailConfigured()) {
            LOGGER.warn("Product {} email skipped for product {} because CEOS_MAIL_USERNAME is not configured.", emailType, product.id());
            return;
        }

        Set<String> recipientEmails = cleanRecipientEmails(users);

        if (recipientEmails.isEmpty()) {
            LOGGER.warn("Product {} email skipped for product {} because there are no registered recipients.", emailType, product.id());
            return;
        }

        LOGGER.info("Sending product {} email for product {} to {} recipients.", emailType, product.id(), recipientEmails.size());

        for (String email : recipientEmails) {
            sendProductHtmlEmail(email, subject, body, product);
        }
    }

    private void sendHtmlEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(mailUsername);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            LOGGER.info("Marketing email sent to {} with subject '{}'.", to, subject);
        } catch (MessagingException | MailException exception) {
            LOGGER.warn("Marketing email could not be sent to {} with subject '{}'.", to, subject, exception);
        }
    }

    private void sendWelcomeEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailUsername);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            helper.addInline(
                WELCOME_HERO_CONTENT_ID,
                new ClassPathResource(WELCOME_HERO_RESOURCE),
                "image/jpeg"
            );
            mailSender.send(message);
            LOGGER.info("Welcome email sent to {} with subject '{}'.", to, subject);
        } catch (MessagingException | MailException exception) {
            LOGGER.warn("Welcome email could not be sent to {} with subject '{}'.", to, subject, exception);
        }
    }

    private void sendProductHtmlEmail(String to, String subject, String body, Product product) {
        try {
            InlineImage inlineImage = inlineImageFor(product);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, inlineImage != null, "UTF-8");
            helper.setFrom(mailUsername);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);

            if (inlineImage != null) {
                helper.addInline(
                    inlineImage.contentId(),
                    new ByteArrayDataSource(inlineImage.bytes(), inlineImage.contentType())
                );
            }

            mailSender.send(message);
            LOGGER.info("Product marketing email sent to {} with subject '{}'.", to, subject);
        } catch (MessagingException | MailException exception) {
            LOGGER.warn("Product marketing email could not be sent to {} with subject '{}'.", to, subject, exception);
        }
    }

    private boolean isMailConfigured() {
        return mailUsername != null && !mailUsername.isBlank();
    }

    private String buildWelcomeBody(User user) {
        String name = escapeHtml(user.name());
        String catalogUrl = escapeHtml(frontendBaseUrl + "/productos");
        String profileUrl = escapeHtml(frontendBaseUrl + "/mi-perfil");

        return """
            <!doctype html>
            <html>
              <body style="margin:0;background:#efefef;padding:28px;font-family:Arial,Helvetica,sans-serif;color:#161616;">
                <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #dedede;box-shadow:0 18px 50px rgba(0,0,0,0.08);">
                  <div style="background:#0d0d0f;">
                    <img src="cid:%s" alt="CEOS Brand" style="display:block;width:100%%;height:330px;object-fit:cover;">
                    <div style="color:#ffffff;padding:30px 34px;">
                      <div style="font-size:13px;letter-spacing:5px;text-transform:uppercase;color:#f0c36b;font-weight:800;">CEOS BRAND</div>
                      <h1 style="margin:12px 0 0;font-size:36px;line-height:1.08;">Bienvenido a la familia</h1>
                      <p style="margin:14px 0 0;color:#d7d7d7;font-size:16px;line-height:1.6;">Ropa con identidad propia, drops limitados y avisos antes de que las prendas vuelen.</p>
                    </div>
                  </div>

                  <div style="padding:32px 34px 12px;font-size:16px;line-height:1.7;color:#333;">
                    <p style="margin:0 0 12px;font-size:20px;font-weight:800;color:#111;">Hola %s, tu cuenta ya esta activa.</p>
                    <p style="margin:0;">Desde ahora puedes comprar prendas, guardar tus datos, revisar tus pedidos y recibir avisos cuando lancemos nuevos productos o repongamos stock.</p>
                  </div>

                  <div style="padding:14px 34px 28px;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width:33.33%%;padding:10px;">
                          <div style="height:100%%;padding:18px;background:#f6f1e8;border-radius:16px;border:1px solid #eadfca;">
                            <div style="font-size:24px;font-weight:900;color:#111;">01</div>
                            <div style="margin-top:8px;font-size:14px;line-height:1.45;color:#3b3327;font-weight:700;">Drops y reposiciones antes que nadie</div>
                          </div>
                        </td>
                        <td style="width:33.33%%;padding:10px;">
                          <div style="height:100%%;padding:18px;background:#f7f7f7;border-radius:16px;border:1px solid #e6e6e6;">
                            <div style="font-size:24px;font-weight:900;color:#111;">02</div>
                            <div style="margin-top:8px;font-size:14px;line-height:1.45;color:#333;font-weight:700;">Pedidos y perfil siempre a mano</div>
                          </div>
                        </td>
                        <td style="width:33.33%%;padding:10px;">
                          <div style="height:100%%;padding:18px;background:#111113;border-radius:16px;border:1px solid #232323;">
                            <div style="font-size:24px;font-weight:900;color:#f0c36b;">03</div>
                            <div style="margin-top:8px;font-size:14px;line-height:1.45;color:#ffffff;font-weight:700;">Atencion directa desde Osuna</div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="padding:20px 0 0;">
                      <a href="%s" style="display:inline-block;background:#0d0d0f;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:900;">Ver catalogo</a>
                      <a href="%s" style="display:inline-block;margin-left:10px;color:#111;text-decoration:none;border-bottom:2px solid #f0c36b;padding:12px 2px 8px;font-size:15px;font-weight:900;">Mi perfil</a>
                    </div>
                  </div>

                  <div style="padding:20px 34px;background:#f8f8f8;color:#777;font-size:13px;line-height:1.6;">
                    Recibes este correo porque has creado una cuenta en CEOS Brand.
                  </div>
                </div>
              </body>
            </html>
            """.formatted(WELCOME_HERO_CONTENT_ID, name, catalogUrl, profileUrl);
    }

    private Set<String> cleanRecipientEmails(List<User> users) {
        Set<String> emails = new LinkedHashSet<>();

        for (User user : users) {
            if (user.email() != null && !user.email().isBlank()) {
                String email = user.email().trim().toLowerCase();
                if (!CEOS_CONTACT_EMAIL.equals(email)) {
                    emails.add(email);
                }
            }
        }

        return emails;
    }

    private String buildProductLaunchBody(Product product) {
        return buildProductAnnouncementBody(
            product,
            "Nuevo lanzamiento",
            "Una nueva prenda acaba de llegar a CEOS Brand.",
            "Este producto ya esta disponible en CEOS Brand.",
            "Nuevo drop",
            "Te avisamos porque tienes una cuenta en CEOS Brand."
        );
    }

    private String buildProductRestockBody(Product product) {
        return buildProductAnnouncementBody(
            product,
            "Vuelve el stock",
            "Una prenda agotada vuelve a estar disponible.",
            "Este producto estaba agotado y acaba de volver a tener stock.",
            "Reposicion",
            "Las unidades pueden ser limitadas. Si te gusta, no la dejes demasiado tiempo en favoritos."
        );
    }

    private String buildProductAnnouncementSoonBody(Product product) {
        return buildProductAnnouncementBody(
            product,
            "Acaba de anunciarse",
            "Una nueva prenda se esta preparando para llegar a CEOS Brand.",
            "Este producto acaba de anunciarse y ya mismo estara disponible en la web.",
            "Proximamente",
            "Estate atento al catalogo: avisaremos cuando pase a estar disponible."
        );
    }

    private String buildProductAnnouncementBody(
        Product product,
        String title,
        String subtitle,
        String intro,
        String badge,
        String footerText
    ) {
        String productName = escapeHtml(product.name());
        String productCategory = escapeHtml(product.category());
        String productImage = escapeHtml(emailImageSource(product));
        String price = product.price() == null ? "" : product.price().toPlainString() + " EUR";
        String productUrl = escapeHtml(frontendBaseUrl + "/productos/" + product.id());
        String catalogUrl = escapeHtml(frontendBaseUrl + "/productos");

        return """
            <!doctype html>
            <html>
              <body style="margin:0;background:#efefef;padding:28px;font-family:Arial,Helvetica,sans-serif;color:#161616;">
                <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #dedede;box-shadow:0 18px 50px rgba(0,0,0,0.08);">
                  <div style="background:#0d0d0f;color:#ffffff;padding:28px 34px;">
                    <div style="font-size:13px;letter-spacing:5px;text-transform:uppercase;color:#f0c36b;font-weight:800;">CEOS BRAND</div>
                    <h1 style="margin:12px 0 0;font-size:34px;line-height:1.1;">%s</h1>
                    <p style="margin:12px 0 0;color:#d7d7d7;font-size:16px;line-height:1.55;">%s</p>
                  </div>

                  <div style="padding:30px 34px;font-size:16px;line-height:1.7;color:#333;">
                    <p style="margin:0 0 18px;">%s</p>
                    <img src="%s" alt="%s" width="652" style="display:block;width:100%%;height:auto;max-height:420px;object-fit:cover;border:0;border-radius:18px;margin-bottom:20px;">
                    <div style="padding:22px;background:#f7f7f7;border-radius:18px;border:1px solid #e8e8e8;">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#777;font-weight:800;">%s - %s</div>
                      <div style="margin-top:8px;font-size:26px;font-weight:900;color:#111;line-height:1.2;">%s</div>
                      <div style="margin-top:8px;color:#555;font-weight:800;">%s</div>
                      <div style="margin-top:18px;">
                        <a href="%s" style="display:inline-block;background:#0d0d0f;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:900;">Ver producto</a>
                        <a href="%s" style="display:inline-block;margin-left:10px;color:#111;text-decoration:none;border-bottom:2px solid #f0c36b;padding:12px 2px 8px;font-size:15px;font-weight:900;">Ver catalogo</a>
                      </div>
                    </div>
                    <p style="margin:18px 0 0;color:#666;">%s</p>
                  </div>

                  <div style="padding:20px 34px;background:#f8f8f8;color:#777;font-size:13px;line-height:1.6;">
                    Te avisamos porque tienes una cuenta en CEOS Brand.
                  </div>
                </div>
              </body>
            </html>
            """.formatted(
            escapeHtml(title),
            escapeHtml(subtitle),
            escapeHtml(intro),
            productImage,
            productName,
            escapeHtml(badge),
            productCategory,
            productName,
            price,
            productUrl,
            catalogUrl,
            escapeHtml(footerText)
        );
    }

    private String emailImageSource(Product product) {
        if (isPublicHttpUrl(product.imageUrl())) {
            return product.imageUrl().trim();
        }

        for (String image : product.images()) {
            if (isPublicHttpUrl(image)) {
                return image.trim();
            }
        }

        InlineImage inlineImage = inlineImageFor(product);
        if (inlineImage != null) {
            return "cid:" + inlineImage.contentId();
        }

        LOGGER.warn("Product {} does not have an email-renderable image.", product.id());
        return "";
    }

    private boolean isPublicHttpUrl(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String trimmed = value.trim().toLowerCase();
        return trimmed.startsWith("https://") || trimmed.startsWith("http://");
    }

    private InlineImage inlineImageFor(Product product) {
        InlineImage mainImage = parseInlineImage(product.imageUrl(), "product-" + product.id());
        if (mainImage != null) {
            return mainImage;
        }

        int index = 0;
        for (String image : product.images()) {
            InlineImage parsed = parseInlineImage(image, "product-" + product.id() + "-" + index);
            if (parsed != null) {
                return parsed;
            }
            index++;
        }

        return null;
    }

    private InlineImage parseInlineImage(String value, String contentId) {
        if (value == null || !value.startsWith("data:image/")) {
            return null;
        }

        int separatorIndex = value.indexOf(',');
        int metadataEndIndex = value.indexOf(';');

        if (separatorIndex < 0 || metadataEndIndex < 0 || metadataEndIndex > separatorIndex) {
            return null;
        }

        String contentType = value.substring("data:".length(), metadataEndIndex);
        String base64 = value.substring(separatorIndex + 1);

        try {
            return new InlineImage(contentId, contentType, Base64.getDecoder().decode(base64.getBytes(StandardCharsets.UTF_8)));
        } catch (IllegalArgumentException exception) {
            LOGGER.warn("Product image data URL could not be decoded for content id {}.", contentId);
            return null;
        }
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

    private record InlineImage(String contentId, String contentType, byte[] bytes) {
    }
}
