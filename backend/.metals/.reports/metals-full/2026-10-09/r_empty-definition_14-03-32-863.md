error id: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/PublicationService.java:
file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/PublicationService.java
empty definition using pc, found symbol in pc: 
empty definition using semanticdb
empty definition using fallback
non-local guesses:

offset: 4855
uri: file:///C:/Users/moham/Documents/JEE/lias/backend/src/main/java/ma/univh2c/fsbm/lias/service/PublicationService.java
text:
```scala
package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.dto.DocumentDTO;
import ma.univh2c.fsbm.lias.dto.PageDTO;
import ma.univh2c.fsbm.lias.dto.PublicationDTO;
import ma.univh2c.fsbm.lias.dto.PublicationRequest;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.entity.Publication;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.exception.ConflitEtatException;
import ma.univh2c.fsbm.lias.mapper.PublicationMapper;
import ma.univh2c.fsbm.lias.repository.ConventionRepository;
import ma.univh2c.fsbm.lias.repository.EquipeRepository;
import ma.univh2c.fsbm.lias.repository.MembreRepository;
import ma.univh2c.fsbm.lias.repository.PublicationRepository;
import ma.univh2c.fsbm.lias.security.MembreDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicationService {

    private final PublicationRepository publicationRepository;
    private final MembreRepository membreRepository;
    private final EquipeRepository equipeRepository;
    private final ConventionRepository conventionRepository;
    private final PublicationMapper publicationMapper;

    public List<PublicationDTO> listerToutesLesPublications() {
        return publicationMapper.toDtoList(publicationRepository.findAll());
    }

    public List<PublicationDTO> listerPublicationsParMembre(Long membreId) {
        return publicationMapper.toDtoList(publicationRepository.findByMembreId(membreId));
    }

    public List<PublicationDTO> listerPublicationsParEquipe(Long equipeId) {
        return publicationMapper.toDtoList(publicationRepository.findByEquipeId(equipeId));
    }

    @Transactional
    public PublicationDTO ajouterPublication(PublicationRequest request) {
        MembreDetails details = (MembreDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Membre connecte = details.getMembre();
        
        if (connecte.getStatut() == StatutMembre.DOCTORANT) {
            boolean estAuteur = request.getAuteursInternesIds().contains(connecte.getId());
            if (!estAuteur) {
                throw new ConflitEtatException("AUTEUR_MANQUANT", "Un doctorant doit figurer parmi les auteurs de la publication qu'il soumet.");
            }
        }
        
        Publication publication = new Publication();
        publication.setTitre(request.getTitre());
        publication.setAnnee(request.getAnnee());
        publication.setResume(request.getResume());
        publication.setLienDoi(request.getLienDoi());
        publication.setCoAuteursExternes(request.getCoAuteursExternes());

        // Rattachement des auteurs internes
        List<Membre> auteursInternes = membreRepository.findAllById(request.getAuteursInternesIds());
        if (auteursInternes.isEmpty()) {
            throw new RessourceIntrouvableException("Aucun auteur interne valide trouvé avec les IDs fournis");
        }
        publication.setAuteursInternes(auteursInternes);

        // Rattachement optionnel à l'équipe
        if (request.getEquipeId() != null) {
            publication.setEquipe(equipeRepository.findById(request.getEquipeId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable")));
        }

        // Rattachement optionnel à une convention
        if (request.getConventionId() != null) {
            publication.setConvention(conventionRepository.findById(request.getConventionId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Convention introuvable")));
        }

        return publicationMapper.toDto(publicationRepository.save(publication));
    }

    @Transactional
    public void supprimerPublication(Long id) {
        Publication publication = publicationRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Publication introuvable"));
        
        publication.setArchive(true); // Suppression logique via SoftDeleteRepository
        publicationRepository.save(publication);
    }

    public PublicationDTO getPublication(Long id) {
        return publicationMapper.toDto(publicationRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Publication introuvable")));
    }

    public PageDTO<PublicationDTO> rechercherPublications(String titre, Integer annee, org.springframework.data.domain.Pageable@@ pageable) {
        Specification<Publication> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            
            if (titre != null && !titre.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("titre")), "%" + titre.toLowerCase() + "%"));
            }
            
            if (annee != null) {
                predicates.add(cb.equal(root.get("annee"), annee));
            }
            
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        
        return PageDTO.of(publicationRepository.findAll(spec, pageable), publicationMapper::toDto);
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: 