package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.ActiviteDTO;
import ma.univh2c.fsbm.lias.dto.ActiviteRequest;
import ma.univh2c.fsbm.lias.service.ActiviteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activites")
@RequiredArgsConstructor
public class ActiviteController {

    private final ActiviteService activiteService;

    @GetMapping
    public ResponseEntity<List<ActiviteDTO>> getActivites() {
        return ResponseEntity.ok(activiteService.listerActivites());
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<ActiviteDTO> creerActivite(@Valid @RequestBody ActiviteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(activiteService.creerActivite(request));
    }

    @PutMapping("/{id}/archiver")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> supprimerActivite(@PathVariable Long id) {
        activiteService.supprimerActivite(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<ActiviteDTO> modifierActivite(@PathVariable Long id, @Valid @RequestBody ActiviteRequest request) {
        return ResponseEntity.ok(activiteService.modifierActivite(id, request));
    }
}
