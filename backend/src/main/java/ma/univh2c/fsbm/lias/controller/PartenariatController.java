package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.ConventionDTO;
import ma.univh2c.fsbm.lias.dto.ConventionDetailDTO;
import ma.univh2c.fsbm.lias.dto.ConventionRequest;
import ma.univh2c.fsbm.lias.dto.PartenaireDTO;
import ma.univh2c.fsbm.lias.dto.PartenaireRequest;
import ma.univh2c.fsbm.lias.dto.StatutConventionRequest;
import ma.univh2c.fsbm.lias.service.PartenariatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/partenariats", "/api"})
@RequiredArgsConstructor
public class PartenariatController {

    private final PartenariatService partenariatService;

    // --- ROUTES PARTENAIRES ---
    @GetMapping("/partenaires")
    public ResponseEntity<List<PartenaireDTO>> getPartenaires() {
        return ResponseEntity.ok(partenariatService.listerPartenaires());
    }

    @PostMapping("/partenaires")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<PartenaireDTO> creerPartenaire(@Valid @RequestBody PartenaireRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(partenariatService.creerPartenaire(request));
    }

    @PutMapping("/partenaires/{id}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<PartenaireDTO> modifierPartenaire(@PathVariable Long id, @Valid @RequestBody PartenaireRequest request) {
        return ResponseEntity.ok(partenariatService.modifierPartenaire(id, request));
    }

    // --- ROUTES CONVENTIONS ---
    @GetMapping("/conventions")
    public ResponseEntity<List<ConventionDTO>> getConventions() {
        return ResponseEntity.ok(partenariatService.listerConventions());
    }

    @PostMapping("/conventions")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<ConventionDTO> creerConvention(@Valid @RequestBody ConventionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(partenariatService.creerConvention(request));
    }

    @GetMapping("/conventions/{id}")
    public ResponseEntity<ConventionDetailDTO> getConventionDetail(@PathVariable Long id) {
        return ResponseEntity.ok(partenariatService.getConventionDetail(id));
    }

    @PutMapping("/conventions/{id}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<ConventionDTO> modifierConvention(@PathVariable Long id, @Valid @RequestBody ConventionRequest request) {
        return ResponseEntity.ok(partenariatService.modifierConvention(id, request));
    }
    
    @PutMapping("/conventions/{id}/statut")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> changerStatutConvention(@PathVariable Long id, @Valid @RequestBody StatutConventionRequest request) {
        partenariatService.changerStatutConvention(id, request.getStatut());
        return ResponseEntity.ok().build();
    }
}
