package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.AttributionMaterielDTO;
import ma.univh2c.fsbm.lias.dto.AttributionRequest;
import ma.univh2c.fsbm.lias.dto.DecisionMaterielRequest;
import ma.univh2c.fsbm.lias.dto.DemandeMaterielDTO;
import ma.univh2c.fsbm.lias.dto.DemandeMaterielRequest;
import ma.univh2c.fsbm.lias.dto.DistributionMaterielGroupeRequest;
import ma.univh2c.fsbm.lias.dto.MaterielDTO;
import ma.univh2c.fsbm.lias.dto.MaterielRequest;
import ma.univh2c.fsbm.lias.dto.MembreInterneDTO;
import ma.univh2c.fsbm.lias.service.MaterielService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materiel")
@RequiredArgsConstructor
public class MaterielController {

    private final MaterielService materielService;

    @GetMapping({"", "/stock"})
    public ResponseEntity<List<MaterielDTO>> getStock() {
        return ResponseEntity.ok(materielService.listerStock());
    }

    @GetMapping("/mes-demandes")
    public ResponseEntity<List<DemandeMaterielDTO>> getMesDemandes() {
        return ResponseEntity.ok(materielService.listerDemandes());
    }

    @GetMapping("/demandes")
    public ResponseEntity<ma.univh2c.fsbm.lias.dto.PageDTO<DemandeMaterielDTO>> getDemandes(
            @RequestParam(required = false) ma.univh2c.fsbm.lias.enums.StatutDemandeMateriel statut,
            org.springframework.data.domain.Pageable pageable) {

        return ResponseEntity.ok(materielService.rechercherDemandes(statut, pageable));
    }

    @PostMapping("/demandes")
    @PreAuthorize("hasRole('PERMANENT') or hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<DemandeMaterielDTO> soumettreDemande(@Valid @RequestBody DemandeMaterielRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(materielService.soumettreDemande(request));
    }

    @PutMapping("/demandes/{id}/valider")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> validerDemande(@PathVariable Long id,
            @Valid @RequestBody(required = false) DecisionMaterielRequest request) {
        materielService.validerDemande(id, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/demandes/{id}/retourner")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> retournerDemande(@PathVariable Long id) {
        materielService.retournerMateriel(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/demandes/{id}/refuser")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> refuserDemande(@PathVariable Long id,
            @Valid @RequestBody DecisionMaterielRequest request) {
        materielService.refuserDemande(id, request);
        return ResponseEntity.ok().build();
    }

    // "Qui n'a pas reçu" : membres actifs sans aucune attribution
    @GetMapping("/membres-non-equipes")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<List<MembreInterneDTO>> getMembresNonEquipes() {
        return ResponseEntity.ok(materielService.getMembresNonEquipes());
    }

    // "Qui a reçu quoi" : historique complet des attributions
    @GetMapping("/attributions")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<List<AttributionMaterielDTO>> getHistoriqueAttributions() {
        return ResponseEntity.ok(materielService.listerAttributions());
    }

    @PostMapping("/attribuer")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> attribuerMateriel(@Valid @RequestBody AttributionRequest request) {
        materielService.attribuerMaterielDirectement(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/distribuer-groupe")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<java.util.Map<String, Object>> distribuerMaterielGroupe(
            @Valid @RequestBody DistributionMaterielGroupeRequest request) {
        int totalBeneficiaires = materielService.distribuerMaterielGroupe(request);
        return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "totalBeneficiaires", totalBeneficiaires,
                "message", "Distribution directe effectuée avec succès pour " + totalBeneficiaires + " membre(s)."
        ));
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<MaterielDTO> declarerArrivage(@Valid @RequestBody MaterielRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(materielService.declarerArrivage(request));
    }
}
