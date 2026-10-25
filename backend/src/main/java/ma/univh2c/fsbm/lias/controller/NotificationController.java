package ma.univh2c.fsbm.lias.controller;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.NotificationDTO;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import ma.univh2c.fsbm.lias.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getMesNotifications() {
        return ResponseEntity.ok(notificationService.getMesNotifications());
    }

    @GetMapping("/toutes")
    public ResponseEntity<ma.univh2c.fsbm.lias.dto.PageDTO<NotificationDTO>> getToutesMesNotifications(
            @RequestParam(required = false) TypeNotification type,
            org.springframework.data.domain.Pageable pageable) {
        
        return ResponseEntity.ok(notificationService.rechercherMesNotifications(type, pageable));
    }

    @GetMapping("/non-lues/count")
    public ResponseEntity<Map<String, Long>> getCountNonLues() {
        return ResponseEntity.ok(notificationService.getNombreNonLues());
    }

    @PutMapping("/{id}/lire")
    public ResponseEntity<Void> marquerCommeLue(@PathVariable Long id) {
        notificationService.marquerCommeLue(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/lire-tout")
    public ResponseEntity<Void> marquerToutCommeLu(@RequestParam(required = false) TypeNotification type) {
        notificationService.marquerToutCommeLu(type);
        return ResponseEntity.ok().build();
    }
}