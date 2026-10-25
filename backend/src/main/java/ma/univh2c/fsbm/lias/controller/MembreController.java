package ma.univh2c.fsbm.lias.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.service.MembreService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/membres")
@RequiredArgsConstructor
public class MembreController {

    private final MembreService membreService;

    @GetMapping
    public ResponseEntity<ma.univh2c.fsbm.lias.dto.PageDTO<MembreInterneDTO>> getAnnuaireInterne(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ma.univh2c.fsbm.lias.enums.StatutMembre statut,
            @RequestParam(required = false) ma.univh2c.fsbm.lias.enums.EtatCompte etatCompte,
            @RequestParam(required = false) Long equipeId,
            org.springframework.data.domain.Pageable pageable) {
        
        return ResponseEntity.ok(membreService.rechercherMembres(q, statut, etatCompte, equipeId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MembreInterneDTO> getMembre(@PathVariable Long id) {
        return ResponseEntity.ok(membreService.getMembreParId(id));
    }

    @GetMapping({"/moi", "/me"})
    public ResponseEntity<MembreProfilDTO> getMonProfil() {
        return ResponseEntity.ok(membreService.getMonProfil());
    }

    @PutMapping({"/profil", "/moi", "/me"})
    public ResponseEntity<MembreProfilDTO> modifierMonProfil(
            @Valid @RequestBody MembreModificationRequest request) {
        return ResponseEntity.ok(membreService.modifierMonProfil(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@securite.estProprietaire(#id)")
    public ResponseEntity<MembreProfilDTO> modifierProfil(@PathVariable Long id,
            @Valid @RequestBody MembreModificationRequest request) {
        return ResponseEntity.ok(membreService.modifierMonProfil(request));
    }

    @GetMapping("/{id}/historique")
    public ResponseEntity<HistoriqueMembreDTO> getHistoriqueMembre(@PathVariable Long id) {
        return ResponseEntity.ok(membreService.getHistoriqueMembre(id));
    }

    @PutMapping("/{id}/statut")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> changerStatut(@PathVariable Long id,
            @Valid @RequestBody ChangementStatutRequest request) {
        membreService.changerStatut(id, request.getNouveauStatut());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/equipe")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> affecterEquipe(@PathVariable Long id,
            @Valid @RequestBody AffectationEquipeRequest request) {
        membreService.affecterEquipe(id, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> promouvoirChefEquipe(@PathVariable Long id,
            @Valid @RequestBody PromotionRequest request) {
        membreService.promouvoirChefEquipe(id, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/depart")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> declarerDepart(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        LocalDate dateDepart = (payload != null && payload.containsKey("dateDepart") && !payload.get("dateDepart").isBlank())
                ? LocalDate.parse(payload.get("dateDepart"))
                : LocalDate.now();
        membreService.declarerDepart(id, dateDepart);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/retraite")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> mettreALaRetraite(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        LocalDate dateRetraite = (payload != null && payload.containsKey("dateRetraite") && !payload.get("dateRetraite").isBlank())
                ? LocalDate.parse(payload.get("dateRetraite"))
                : LocalDate.now();
        membreService.mettreALaRetraite(id, dateRetraite);
        return ResponseEntity.ok().build();
    }

    @PutMapping({"/{id}/reintegrer", "/{id}/reactiver"})
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> reactiverCompte(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        LocalDate dateRetour = (payload != null && payload.containsKey("dateRetour") && !payload.get("dateRetour").isBlank())
                ? LocalDate.parse(payload.get("dateRetour"))
                : LocalDate.now();
        membreService.reactiverCompte(id, dateRetour);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/renvoyer-acces")
    @PreAuthorize("hasRole('DIRECTEUR') or hasRole('VICE_DIRECTEUR') or hasRole('ADMIN')")
    public ResponseEntity<Void> renvoyerAcces(@PathVariable Long id) {
        membreService.renvoyerAcces(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/photo")
    @PreAuthorize("@securite.estProprietaire(#id)")
    public ResponseEntity<MembreProfilDTO> uploaderPhoto(
            @PathVariable Long id,
            @RequestParam("fichier") MultipartFile fichier) {
        return ResponseEntity.ok(membreService.mettreAJourPhoto(id, fichier));
    }

    @DeleteMapping("/{id}/photo")
    @PreAuthorize("@securite.estProprietaire(#id)")
    public ResponseEntity<MembreProfilDTO> supprimerPhoto(@PathVariable Long id) {
        return ResponseEntity.ok(membreService.supprimerPhoto(id));
    }
}
