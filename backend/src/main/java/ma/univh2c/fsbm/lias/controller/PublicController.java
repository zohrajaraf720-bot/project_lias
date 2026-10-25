package ma.univh2c.fsbm.lias.controller;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.ActiviteDTO;
import ma.univh2c.fsbm.lias.dto.EquipeDTO;
import ma.univh2c.fsbm.lias.dto.EquipePublicDTO;
import ma.univh2c.fsbm.lias.dto.EvenementPublicDTO;
import ma.univh2c.fsbm.lias.entity.Laboratoire;
import ma.univh2c.fsbm.lias.repository.LaboratoireRepository;
import ma.univh2c.fsbm.lias.service.ActiviteService;
import ma.univh2c.fsbm.lias.service.EquipeService;
import ma.univh2c.fsbm.lias.service.EvenementService;
import ma.univh2c.fsbm.lias.service.PublicationService;

import ma.univh2c.fsbm.lias.enums.TypeEvenement;
import ma.univh2c.fsbm.lias.enums.TypePublication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final LaboratoireRepository laboratoireRepository;
    private final EquipeService equipeService;
    private final ActiviteService activiteService;
    private final EvenementService evenementService;
    private final PublicationService publicationService;
    private final ma.univh2c.fsbm.lias.repository.MembreRepository membreRepository;
    private final ma.univh2c.fsbm.lias.service.MembreService membreService;

    @GetMapping("/chercheurs")
    public ResponseEntity<List<ma.univh2c.fsbm.lias.dto.MembreResumeDTO>> getChercheursPublics() {
        return ResponseEntity.ok(membreRepository.findAll().stream()
                .filter(m -> m.getEtatCompte() == ma.univh2c.fsbm.lias.enums.EtatCompte.ACTIF)
                .map(membreService::convertirEnResumeDTO)
                .toList());
    }

    @GetMapping("/laboratoire")
    public ResponseEntity<Laboratoire> getPresentationLaboratoire() {
        return ResponseEntity.ok(laboratoireRepository.findAll().stream().findFirst().orElse(null));
    }

    @GetMapping("/equipes")
    public ResponseEntity<List<EquipeDTO>> getEquipesPubliques() {
        return ResponseEntity.ok(equipeService.listerEquipes());
    }

    @GetMapping("/equipes/{id}")
    public ResponseEntity<EquipePublicDTO> getEquipePubliqueDetail(@PathVariable Long id) {
        return ResponseEntity.ok(equipeService.getEquipePublique(id));
    }

    @GetMapping("/activites")
    public ResponseEntity<List<ActiviteDTO>> getActivitesPubliques() {
        return ResponseEntity.ok(activiteService.listerActivites());
    }

    @GetMapping("/evenements")
    public ResponseEntity<List<EvenementPublicDTO>> getEvenementsPublics(
            @RequestParam(required = false) TypeEvenement type) {
        List<EvenementPublicDTO> list = evenementService.listerEvenementsPublics();
        if (type != null) {
            list = list.stream().filter(e -> e.getType() == type).collect(Collectors.toList());
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/evenements/{id}")
    public ResponseEntity<EvenementPublicDTO> getEvenementPublic(@PathVariable Long id) {
        return ResponseEntity.ok(evenementService.getEvenementPublic(id));
    }

    @GetMapping("/publications")
    public ResponseEntity<ma.univh2c.fsbm.lias.dto.PageDTO<ma.univh2c.fsbm.lias.dto.PublicationDTO>> getPublicationsPubliques(
            org.springframework.data.domain.Pageable pageable,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long equipeId,
            @RequestParam(required = false) Integer annee,
            @RequestParam(required = false) Long auteurId,
            @RequestParam(required = false) TypePublication type) {
        return ResponseEntity.ok(publicationService.rechercherPublications(q, equipeId, annee, auteurId, type, pageable));
    }
}