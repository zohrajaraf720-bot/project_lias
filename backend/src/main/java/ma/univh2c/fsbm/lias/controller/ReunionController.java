package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.dto.ReunionDTO;
import ma.univh2c.fsbm.lias.dto.ReunionRequest;
import ma.univh2c.fsbm.lias.entity.Document;
import ma.univh2c.fsbm.lias.enums.StatutReunion;
import ma.univh2c.fsbm.lias.service.FileStorageService;
import ma.univh2c.fsbm.lias.service.ReunionService;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reunions")
@RequiredArgsConstructor
public class ReunionController {

    private final ReunionService reunionService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<PageDTO<ReunionDTO>> getToutesLesReunions(
            @RequestParam(required = false) StatutReunion statut,
            Pageable pageable) {
            
        return ResponseEntity.ok(reunionService.rechercherReunions(statut, pageable));
    }

    @GetMapping("/mes-reunions")
    public ResponseEntity<List<ReunionDTO>> getMesReunions() {
        return ResponseEntity.ok(reunionService.listerReunionsDuMembre());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReunionDTO> getReunion(@PathVariable Long id) {
        return ResponseEntity.ok(reunionService.getReunion(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('PERMANENT') or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<ReunionDTO> planifierReunion(@Valid @RequestBody ReunionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reunionService.planifierReunion(request));
    }

    @PostMapping("/{id}/pv")
    @PreAuthorize("@securite.estOrganisateurReunion(#id) or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<ReunionDTO> attacherPV(
            @PathVariable Long id,
            @RequestParam(value = "fichier", required = false) MultipartFile fichier,
            @RequestParam(value = "fichierPv", required = false) MultipartFile fichierPv) {
        MultipartFile fileToUse = fichier != null ? fichier : fichierPv;
        if (fileToUse == null || fileToUse.isEmpty()) {
            throw new IllegalArgumentException("Le fichier PV est obligatoire.");
        }
        return ResponseEntity.ok(reunionService.attacherPV(id, fileToUse));
    }

    @GetMapping("/{id}/pv")
    @PreAuthorize("@securite.estParticipantOuOrganisateurReunion(#id) or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Resource> telechargerPV(@PathVariable Long id) {
        Document pv = reunionService.getPvDocument(id);
        Resource resource = fileStorageService.chargerFichier(pv.getCheminFichier());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + pv.getTitre() + "\"")
                .body(resource);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@securite.estOrganisateurReunion(#id) or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<ReunionDTO> modifierOrdreDuJour(@PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(reunionService.modifierOrdreDuJour(id, payload.get("ordreDuJour")));
    }
}
