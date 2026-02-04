package com.chemicaloop.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Chemicaloop Backend is running");
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "Chemicaloop Backend API");
        response.put("version", "1.0.0");
        return response;
    }
}
