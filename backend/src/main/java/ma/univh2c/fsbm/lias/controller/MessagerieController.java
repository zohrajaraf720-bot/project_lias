package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.CanalDiscussionDTO;
import ma.univh2c.fsbm.lias.dto.MessageDTO;
import ma.univh2c.fsbm.lias.dto.MessageRequest;
import ma.univh2c.fsbm.lias.service.MessagerieService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messagerie")
@RequiredArgsConstructor
public class MessagerieController {

    private final MessagerieService messagerieService;

    @GetMapping("/canaux")
    public ResponseEntity<List<CanalDiscussionDTO>> getMesCanaux() {
        return ResponseEntity.ok(messagerieService.getMesCanaux());
    }

    @GetMapping("/canaux/{canalId}/messages")
    public ResponseEntity<List<MessageDTO>> getMessagesCanal(@PathVariable Long canalId) {
        return ResponseEntity.ok(messagerieService.getMessagesCanal(canalId));
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageDTO> envoyerMessage(@Valid @RequestBody MessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messagerieService.envoyerMessage(request));
    }

    @PutMapping("/canaux/{canalId}/lu")
    public ResponseEntity<Void> marquerCanalLu(@PathVariable Long canalId) {
        messagerieService.marquerCanalLu(canalId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/canaux")
    public ResponseEntity<CanalDiscussionDTO> creerCanal(
            @Valid @RequestBody ma.univh2c.fsbm.lias.dto.CanalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messagerieService.creerCanalDirect(request));
    }
}