error id: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/controller/PublicController.java:_empty_/PublicationService#rechercherPublications#
file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/controller/PublicController.java
empty definition using pc, found symbol in pc: _empty_/PublicationService#rechercherPublications#
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 2821
uri: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/controller/PublicController.java
text:
```scala
package ma.univh2c.fsbm.lias.controller;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.ActiviteDTO;
import ma.univh2c.fsbm.lias.dto.EquipeDTO;
import ma.univh2c.fsbm.lias.dto.EvenementPublicDTO;
import ma.univh2c.fsbm.lias.entity.Laboratoire;
import ma.univh2c.fsbm.lias.repository.LaboratoireRepository;
import ma.univh2c.fsbm.lias.service.ActiviteService;
import ma.univh2c.fsbm.lias.service.EquipeService;
import ma.univh2c.fsbm.lias.service.EvenementService;
import ma.univh2c.fsbm.lias.service.PublicationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final LaboratoireRepository laboratoireRepository;
    private final EquipeService equipeService;
    private final ActiviteService activiteService;
    private final EvenementService evenementService;
    private final PublicationService publicationService;

    @GetMapping("/evenements")
    public ResponseEntity<List<EvenementPublicDTO>> getEvenementsPublics() {
        return ResponseEntity.ok(evenementService.listerEvenementsPublics());
    }

    @GetMapping("/evenements/{id}")
    public ResponseEntity<EvenementPublicDTO> getEvenementPublic(@PathVariable Long id) {
        return ResponseEntity.ok(evenementService.getEvenementPublic(id));
    }

    @GetMapping("/laboratoire")
    public ResponseEntity<Laboratoire> getPresentationLaboratoire() {
        return ResponseEntity.ok(laboratoireRepository.findAll().stream().findFirst().orElse(null));
    }

    @GetMapping("/equipes")
    public ResponseEntity<List<EquipeDTO>> getEquipesPubliques() {
        return ResponseEntity.ok(equipeService.listerEquipes());
    }

    @GetMapping("/activites")
    public ResponseEntity<List<ActiviteDTO>> getActivitesPubliques() {
        // En conditions réelles, appliquer un filtre de statut public si nécessaire
        return ResponseEntity.ok(activiteService.listerActivites());
    }

    @GetMapping("/publications")
    public ResponseEntity<ma.univh2c.fsbm.lias.dto.PageDTO<ma.univh2c.fsbm.lias.dto.PublicationDTO>> getPublicationsPubliques(
            org.springframework.data.domain.Pageable pageable,
            @RequestParam(required = false) String titre,
            @RequestParam(required = false) Integer annee) {
        return ResponseEntity.ok(publicationService.rechercherPublications@@(titre, annee, pageable));
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: _empty_/PublicationService#rechercherPublications#