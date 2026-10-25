package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.DemandeAdhesionDTO;
import ma.univh2c.fsbm.lias.dto.DemandeAdhesionRequest;
import ma.univh2c.fsbm.lias.dto.RefusDemandeRequest;
import ma.univh2c.fsbm.lias.entity.DemandeAdhesion;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.service.DemandeAdhesionService;
import ma.univh2c.fsbm.lias.service.FileStorageService;
import ma.univh2c.fsbm.lias.repository.DemandeAdhesionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping({"/api/demandes", "/api/adhesions"})
@RequiredArgsConstructor
public class DemandeAdhesionController {

    private final DemandeAdhesionService demandeService;
    private final DemandeAdhesionRepository demandeRepository;
    private final FileStorageService fileStorageService;

    // Endpoint public pour soumettre une candidature avec CV et Lettre de motivation
    @PostMapping
    public ResponseEntity<DemandeAdhesionDTO> soumettreDemande(@Valid @ModelAttribute DemandeAdhesionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(demandeService.soumettreDemande(request));
    }

    // Endpoints protégés (Directeur, Vice-Directeur ou Admin)

    @GetMapping
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<ma.univh2c.fsbm.lias.dto.PageDTO<DemandeAdhesionDTO>> getDemandes(
            @RequestParam(required = false) ma.univh2c.fsbm.lias.enums.StatutDemande statut,
            org.springframework.data.domain.Pageable pageable) {
        
        return ResponseEntity.ok(demandeService.rechercherDemandes(statut, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<DemandeAdhesionDTO> getDemandeParId(@PathVariable Long id) {
        return ResponseEntity.ok(demandeService.getDemandeParId(id));
    }

    @RequestMapping(value = {"/{id}/accepter", "/{id}/approuver"}, method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> accepterDemande(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, Object> payload) {
        ma.univh2c.fsbm.lias.enums.StatutMembre statut = null;
        Long equipeId = null;
        if (payload != null) {
            if (payload.containsKey("statut") && payload.get("statut") != null) {
                statut = ma.univh2c.fsbm.lias.enums.StatutMembre.valueOf(payload.get("statut").toString());
            } else if (payload.containsKey("statutSouhaite") && payload.get("statutSouhaite") != null) {
                statut = ma.univh2c.fsbm.lias.enums.StatutMembre.valueOf(payload.get("statutSouhaite").toString());
            }
            if (payload.containsKey("equipeId") && payload.get("equipeId") != null && !payload.get("equipeId").toString().isBlank()) {
                try {
                    equipeId = Long.valueOf(payload.get("equipeId").toString());
                } catch (NumberFormatException ignored) {}
            }
        }
        demandeService.accepterDemande(id, statut, equipeId);
        return ResponseEntity.ok().build();
    }

    @RequestMapping(value = {"/{id}/refuser", "/{id}/rejeter"}, method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> refuserDemande(@PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> payload) {
        String motif = null;
        if (payload != null) {
            motif = payload.getOrDefault("motif", payload.get("commentaireDirection"));
        }
        demandeService.refuserDemande(id, motif);
        return ResponseEntity.ok().build();
    }

    @GetMapping({ "/{id}/dossier-candidat", "/{id}/cv" })
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Resource> telechargerCv(@PathVariable Long id) {
        DemandeAdhesion demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande introuvable"));
        Resource resource = fileStorageService.chargerFichier(demande.getCvUrl());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"CV_" + demande.getNom() + "_" + demande.getPrenom() + ".pdf\"")
                .body(resource);
    }

    @GetMapping({ "/{id}/lettre", "/{id}/lettre-motivation", "/{id}/lettre_motivation" })
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Resource> telechargerLettreMotivation(@PathVariable Long id) {
        DemandeAdhesion demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Demande introuvable"));
        if (demande.getLettreMotivationUrl() == null || demande.getLettreMotivationUrl().isBlank()) {
            throw new RessourceIntrouvableException("Aucune lettre de motivation attachée à cette demande");
        }
        Resource resource = fileStorageService.chargerFichier(demande.getLettreMotivationUrl());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"Lettre_Motivation_" + demande.getNom() + "_" + demande.getPrenom() + ".pdf\"")
                .body(resource);
    }
}
