package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.ClotureMandatRequest;
import ma.univh2c.fsbm.lias.dto.MandatDTO;
import ma.univh2c.fsbm.lias.dto.MandatRequest;
import ma.univh2c.fsbm.lias.dto.MembreResumeDTO;
import ma.univh2c.fsbm.lias.entity.Equipe;
import ma.univh2c.fsbm.lias.entity.Mandat;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import ma.univh2c.fsbm.lias.enums.TypeMandat;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.EquipeRepository;
import ma.univh2c.fsbm.lias.repository.MandatRepository;
import ma.univh2c.fsbm.lias.repository.MembreRepository;
import ma.univh2c.fsbm.lias.security.SecurityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MandatService {

    private final MandatRepository mandatRepository;
    private final MembreRepository membreRepository;
    private final EquipeRepository equipeRepository;
    private final MembreService membreService;
    private final SecurityService securityService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<MandatDTO> listerMandats(Boolean actif, TypeMandat type, Long equipeId) {
        List<Mandat> all = mandatRepository.findAll();
        return all.stream()
                .filter(m -> actif == null || (actif ? m.estActif() : !m.estActif()))
                .filter(m -> type == null || m.getTypeMandat() == type)
                .filter(m -> equipeId == null || (m.getEquipe() != null && m.getEquipe().getId().equals(equipeId)))
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MandatDTO attribuerMandat(MandatRequest request) {
        if (!securityService.peutGererMandats()) {
            throw new RegleMetierException("Vous n'avez pas l'autorisation d'attribuer un mandat. Le Vice-Directeur ne peut que consulter l'historique.");
        }

        Membre membre = membreRepository.findById(request.getMembreId())
                .orElseThrow(() -> new RessourceIntrouvableException("Membre introuvable"));

        if (membre.getEtatCompte() != EtatCompte.ACTIF) {
            throw new RegleMetierException("Le membre doit avoir un compte ACTIF pour recevoir un mandat");
        }
        if (membre.getStatut() != StatutMembre.PERMANENT) {
            throw new RegleMetierException("Seul un membre PERMANENT peut être nommé Directeur, Vice-directeur ou Chef d'équipe");
        }

        LocalDate dateDebut = request.getDateDebut() != null ? request.getDateDebut() : LocalDate.now();

        Equipe equipe = null;
        if (request.getTypeMandat() == TypeMandat.CHEF_EQUIPE) {
            if (request.getEquipeId() == null) {
                throw new RegleMetierException("L'équipe est obligatoire pour un mandat de Chef d'équipe");
            }
            equipe = equipeRepository.findById(request.getEquipeId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Équipe introuvable"));

            // Clôturer l'ancien chef de cette équipe
            mandatRepository.findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat.CHEF_EQUIPE, equipe.getId())
                    .ifPresent(m -> {
                        m.cloturerMandat(dateDebut);
                        mandatRepository.save(m);
                    });
        } else if (request.getTypeMandat() == TypeMandat.DIRECTEUR) {
            // Un seul Directeur actif à la fois
            mandatRepository.findFirstByTypeMandatAndDateFinIsNull(TypeMandat.DIRECTEUR)
                    .ifPresent(m -> {
                        m.cloturerMandat(dateDebut);
                        mandatRepository.save(m);
                    });
        } else if (request.getTypeMandat() == TypeMandat.VICE_DIRECTEUR) {
            // Un seul Vice-Directeur actif à la fois
            mandatRepository.findFirstByTypeMandatAndDateFinIsNull(TypeMandat.VICE_DIRECTEUR)
                    .ifPresent(m -> {
                        m.cloturerMandat(dateDebut);
                        mandatRepository.save(m);
                    });
        }

        Mandat nouveauMandat = Mandat.builder()
                .typeMandat(request.getTypeMandat())
                .dateDebut(dateDebut)
                .membre(membre)
                .equipe(equipe)
                .build();

        Mandat saved = mandatRepository.save(nouveauMandat);

        // Notifications
        String roleStr = request.getTypeMandat().name().replace('_', ' ');
        notificationService.creerNotification(
                membre,
                "Attribution de Mandat : " + roleStr,
                "Vous avez été nommé(e) officiellement au mandat de " + roleStr + " à compter du " + dateDebut + ".",
                TypeNotification.MANDAT,
                "/gouvernance/mandats"
        );

        if (equipe != null) {
            notificationService.notifierMembresEquipe(
                    equipe.getId(),
                    "Nouveau Chef d'Équipe",
                    membre.getPrenom() + " " + membre.getNom() + " a été nommé(e) Chef de votre équipe " + equipe.getNom() + ".",
                    TypeNotification.MANDAT,
                    "/equipes/" + equipe.getId(),
                    membre.getId()
            );
        }

        notificationService.notifierDirection(
                "Nouveau Mandat : " + roleStr,
                "Un mandat de " + roleStr + " a été attribué à " + membre.getPrenom() + " " + membre.getNom() + ".",
                TypeNotification.MANDAT,
                "/gouvernance/mandats"
        );

        return convertirEnDTO(saved);
    }

    @Transactional
    public void cloturerMandat(Long id, ClotureMandatRequest request) {
        if (!securityService.peutGererMandats()) {
            throw new RegleMetierException("Vous n'avez pas l'autorisation de clôturer un mandat. Le Vice-Directeur ne peut que consulter l'historique.");
        }

        Mandat m = mandatRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Mandat introuvable"));

        LocalDate dateFin = (request != null && request.getDateFin() != null) ? request.getDateFin() : LocalDate.now();
        m.cloturerMandat(dateFin);
        mandatRepository.save(m);

        String roleStr = m.getTypeMandat().name().replace('_', ' ');
        if (m.getMembre() != null) {
            notificationService.creerNotification(
                    m.getMembre(),
                    "Fin de Mandat : " + roleStr,
                    "Votre mandat de " + roleStr + " au sein du laboratoire LIAS a pris fin le " + dateFin + ".",
                    TypeNotification.MANDAT,
                    "/gouvernance/mandats"
            );
        }

        notificationService.notifierDirection(
                "Mandat Clôturé",
                "Le mandat de " + roleStr + " pour " + (m.getMembre() != null ? m.getMembre().getPrenom() + " " + m.getMembre().getNom() : "un membre") + " a été clôturé.",
                TypeNotification.MANDAT,
                "/gouvernance/mandats"
        );
    }

    @Transactional(readOnly = true)
    public MandatDTO getMandatParId(Long id) {
        Mandat m = mandatRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Mandat introuvable"));
        return convertirEnDTO(m);
    }

    @Transactional(readOnly = true)
    public List<MandatDTO> getHistoriqueGouvernance() {
        return mandatRepository.findHistoriqueMandats().stream()
                .map(this::convertirEnDTO)
                .collect(Collectors.toList());
    }

    public MandatDTO convertirEnDTO(Mandat m) {
        return MandatDTO.builder()
                .id(m.getId())
                .typeMandat(m.getTypeMandat())
                .dateDebut(m.getDateDebut())
                .dateFin(m.getDateFin())
                .membre(membreService.convertirEnResumeDTO(m.getMembre()))
                .equipeId(m.getEquipe() != null ? m.getEquipe().getId() : null)
                .equipeNom(m.getEquipe() != null ? m.getEquipe().getNom() : null)
                .actif(m.estActif())
                .build();
    }
}
