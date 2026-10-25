package ma.univh2c.fsbm.lias.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping({"/uploads", "/api/uploads"})
@RequiredArgsConstructor
@Slf4j
public class UploadController {

    private final FileStorageService fileStorageService;

    @GetMapping("/**")
    public ResponseEntity<Resource> servirFichier(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String prefix = uri.contains("/api/uploads/") ? "/api/uploads/" : "/uploads/";
        int idx = uri.indexOf(prefix);
        String cheminRelatif = (idx != -1) ? uri.substring(idx + prefix.length()) : uri;

        Resource resource = fileStorageService.chargerFichier(cheminRelatif);

        String contentType = "application/octet-stream";
        try {
            String detected = Files.probeContentType(Paths.get(resource.getFile().getAbsolutePath()));
            if (detected != null) {
                contentType = detected;
            }
        } catch (Exception e) {
            log.debug("Impossible de détecter le Content-Type pour {}", cheminRelatif);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400, public")
                .body(resource);
    }
}
