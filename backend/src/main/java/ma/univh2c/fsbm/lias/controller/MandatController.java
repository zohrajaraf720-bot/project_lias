package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.ClotureMandatRequest;
import ma.univh2c.fsbm.lias.dto.MandatDTO;
import ma.univh2c.fsbm.lias.dto.MandatRequest;
import ma.univh2c.fsbm.lias.enums.TypeMandat;
import ma.univh2c.fsbm.lias.service.MandatService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MandatController {

    private final MandatService mandatService;

    @GetMapping("/mandats")
    public ResponseEntity<List<MandatDTO>> listerMandats(
            @RequestParam(required = false) Boolean actif,
            @RequestParam(required = false) TypeMandat typeMandat,
            @RequestParam(required = false) TypeMandat typeRole,
            @RequestParam(required = false) Long equipeId) {
        TypeMandat type = typeMandat != null ? typeMandat : typeRole;
        return ResponseEntity.ok(mandatService.listerMandats(actif, type, equipeId));
    }

    @PostMapping("/mandats")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<MandatDTO> attribuerMandat(@Valid @RequestBody MandatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mandatService.attribuerMandat(request));
    }

    @PutMapping("/mandats/{id}/cloturer")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> cloturerMandat(@PathVariable Long id, @RequestBody(required = false) ClotureMandatRequest request) {
        mandatService.cloturerMandat(id, request != null ? request : new ClotureMandatRequest());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/mandats/{id}")
    public ResponseEntity<MandatDTO> getMandat(@PathVariable Long id) {
        return ResponseEntity.ok(mandatService.getMandatParId(id));
    }

    @GetMapping({"/mandats/historique", "/gouvernance/historique"})
    public ResponseEntity<List<MandatDTO>> getHistoriqueGouvernance() {
        return ResponseEntity.ok(mandatService.getHistoriqueGouvernance());
    }
}
