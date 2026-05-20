package com.ceos.brand.auth.contact.controller;

import com.ceos.brand.auth.contact.dto.ContactRequest;
import com.ceos.brand.auth.contact.service.ContactService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public Map<String, String> sendMessage(
        @Valid @RequestBody ContactRequest contactRequest,
        HttpServletRequest request
    ) {
        contactService.sendContactEmail(contactRequest, request.getSession(false));
        return Map.of("message", "Mensaje enviado correctamente.");
    }
}
