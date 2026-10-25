package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.ActiviteDTO;
import ma.univh2c.fsbm.lias.dto.ActiviteRequest;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.StatutConvention;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.*;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActiviteService {

    private final ActiviteRepository activiteRepository;
    private final MembreRepository membreRepository;
    private final EquipeRepository equipeRepository;
    private final ConventionRepository conventionRepository;
    private final SecurityService securityService;
    private final MembreService membreService;

    @Transactional(readOnly = true)
    public List<ActiviteDTO> listerActivites() {
        return activiteRepository.findAll().stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ActiviteDTO creerActivite(ActiviteRequest request) {
        Long currentId = securityService.getIdUtilisateurConnecte();
        Long mId = request.getMembreId() != null ? request.getMembreId() : currentId;

        Membre membre = (mId != null) ? membreRepository.findById(mId).orElse(null) : null;
        if (membre == null) {
            throw new RegleMetierException("Le membre porteur de l'activité est obligatoire");
        }

        Equipe eq = null;
        if (request.getEquipeId() != null) {
            eq = equipeRepository.findById(request.getEquipeId()).orElse(null);
        } else {
            eq = membre.getEquipeActuelle();
        }

        Convention convention = null;
        if (request.getConventionId() != null) {
            convention = conventionRepository.findById(request.getConventionId())
                    .filter(c -> c.getStatut() == StatutConvention.EN_COURS)
                    .orElseThrow(() -> new RegleMetierException("La convention sélectionnée n'existe pas ou n'est pas EN_COURS"));
        }

        Activite a = Activite.builder()
                .titre(request.getTitre().trim())
                .description(request.getDescription())
                .type(request.getType())
                .lieu(request.getLieu())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .membre(membre)
                .equipe(eq)
                .convention(convention)
                .build();

        Activite saved = activiteRepository.save(a);
        return convertirEnDTO(saved);
    }

    @Transactional
    public ActiviteDTO modifierActivite(Long id, ActiviteRequest request) {
        Activite a = activiteRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Activité introuvable"));

        a.setTitre(request.getTitre().trim());
        a.setDescription(request.getDescription());
        a.setType(request.getType());
        a.setLieu(request.getLieu());
        a.setDateDebut(request.getDateDebut());
        a.setDateFin(request.getDateFin());

        if (request.getEquipeId() != null) {
            a.setEquipe(equipeRepository.findById(request.getEquipeId()).orElse(null));
        }

        if (request.getConventionId() != null) {
            Convention convention = conventionRepository.findById(request.getConventionId())
                    .filter(c -> c.getStatut() == StatutConvention.EN_COURS)
                    .orElseThrow(() -> new RegleMetierException("La convention sélectionnée n'existe pas ou n'est pas EN_COURS"));
            a.setConvention(convention);
        } else {
            a.setConvention(null);
        }

        Activite saved = activiteRepository.save(a);
        return convertirEnDTO(saved);
    }

    @Transactional
    public void supprimerActivite(Long id) {
        Activite a = activiteRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Activité introuvable"));
        a.setArchive(true);
        activiteRepository.save(a);
    }

    public ActiviteDTO convertirEnDTO(Activite a) {
        return ActiviteDTO.builder()
                .id(a.getId())
                .titre(a.getTitre())
                .description(a.getDescription())
                .type(a.getType())
                .lieu(a.getLieu())
                .dateDebut(a.getDateDebut())
                .dateFin(a.getDateFin())
                .membre(membreService.convertirEnResumeDTO(a.getMembre()))
                .equipeId(a.getEquipe() != null ? a.getEquipe().getId() : null)
                .equipeNom(a.getEquipe() != null ? a.getEquipe().getNom() : null)
                .conventionId(a.getConvention() != null ? a.getConvention().getId() : null)
                .conventionTitre(a.getConvention() != null ? a.getConvention().getTitre() : null)
                .build();
    }
}
