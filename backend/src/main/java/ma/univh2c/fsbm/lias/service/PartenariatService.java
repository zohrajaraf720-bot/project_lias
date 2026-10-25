package ma.univh2c.fsbm.lias.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.univh2c.fsbm.lias.dto.*;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import ma.univh2c.fsbm.lias.entity.*;
import ma.univh2c.fsbm.lias.enums.StatutConvention;
import ma.univh2c.fsbm.lias.exception.RegleMetierException;
import ma.univh2c.fsbm.lias.exception.RessourceIntrouvableException;
import ma.univh2c.fsbm.lias.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartenariatService {

    private final PartenaireRepository partenaireRepository;
    private final ConventionRepository conventionRepository;
    private final DocumentService documentService;
    private final ActiviteService activiteService;
    private final EvenementService evenementService;
    private final PublicationService publicationService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<PartenaireDTO> listerPartenaires() {
        return partenaireRepository.findByArchiveFalse().stream()
                .map(this::convertirPartenaireEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public PartenaireDTO creerPartenaire(PartenaireRequest request) {
        if (partenaireRepository.existsByNomInstitutionIgnoreCase(request.getNomInstitution().trim())) {
            throw new RegleMetierException("Un partenaire avec ce nom existe déjà");
        }

        Partenaire p = Partenaire.builder()
                .nomInstitution(request.getNomInstitution().trim())
                .typeInstitution(request.getTypeInstitution())
                .pays(request.getPays())
                .contactPrincipal(request.getContactPrincipal())
                .emailContact(request.getEmailContact())
                .build();

        Partenaire saved = partenaireRepository.save(p);
        return convertirPartenaireEnDTO(saved);
    }

    @Transactional
    public PartenaireDTO modifierPartenaire(Long id, PartenaireRequest request) {
        Partenaire p = partenaireRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Partenaire introuvable"));

        p.setNomInstitution(request.getNomInstitution().trim());
        p.setTypeInstitution(request.getTypeInstitution());
        p.setPays(request.getPays());
        p.setContactPrincipal(request.getContactPrincipal());
        p.setEmailContact(request.getEmailContact());

        Partenaire saved = partenaireRepository.save(p);
        return convertirPartenaireEnDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<ConventionDTO> listerConventions() {
        return conventionRepository.findAll().stream()
                .map(this::convertirConventionEnDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConventionDTO creerConvention(ConventionRequest request) {
        Partenaire part = partenaireRepository.findById(request.getPartenaireId())
                .orElseThrow(() -> new RessourceIntrouvableException("Partenaire introuvable"));

        if (request.getDateExpiration().isBefore(request.getDateSignature())) {
            throw new RegleMetierException("La date d'expiration ne peut pas être antérieure à la date de signature");
        }

        Convention c = Convention.builder()
                .titre(request.getTitre().trim())
                .dateSignature(request.getDateSignature())
                .dateExpiration(request.getDateExpiration())
                .statut(StatutConvention.EN_COURS)
                .partenaire(part)
                .build();

        Convention saved = conventionRepository.save(c);
        return convertirConventionEnDTO(saved);
    }

    @Transactional(readOnly = true)
    public ConventionDetailDTO getConventionDetail(Long id) {
        Convention c = conventionRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Convention introuvable"));

        List<DocumentDTO> docs = c.getDocuments().stream().map(documentService::convertirEnDTO).collect(Collectors.toList());
        List<ActiviteDTO> acts = c.getActivites().stream().map(activiteService::convertirEnDTO).collect(Collectors.toList());
        List<EvenementDTO> evts = c.getEvenements().stream().map(evenementService::convertirEnDTO).collect(Collectors.toList());
        List<PublicationDTO> pubs = c.getPublications().stream().map(publicationService::convertirEnDTO).collect(Collectors.toList());

        return ConventionDetailDTO.builder()
                .id(c.getId())
                .titre(c.getTitre())
                .dateSignature(c.getDateSignature())
                .dateExpiration(c.getDateExpiration())
                .statut(c.getStatut())
                .partenaire(convertirPartenaireEnDTO(c.getPartenaire()))
                .documents(docs)
                .activites(acts)
                .evenements(evts)
                .publications(pubs)
                .build();
    }

    @Transactional
    public ConventionDTO modifierConvention(Long id, ConventionRequest request) {
        Convention c = conventionRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Convention introuvable"));

        if (request.getPartenaireId() != null) {
            Partenaire part = partenaireRepository.findById(request.getPartenaireId())
                    .orElseThrow(() -> new RessourceIntrouvableException("Partenaire introuvable"));
            c.setPartenaire(part);
        }

        c.setTitre(request.getTitre().trim());
        c.setDateSignature(request.getDateSignature());
        c.setDateExpiration(request.getDateExpiration());

        Convention saved = conventionRepository.save(c);
        return convertirConventionEnDTO(saved);
    }

    @Transactional
    public void changerStatutConvention(Long id, StatutConvention statut) {
        Convention c = conventionRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Convention introuvable"));
        c.setStatut(statut);
        conventionRepository.save(c);
    }

    public PartenaireDTO convertirPartenaireEnDTO(Partenaire p) {
        return PartenaireDTO.builder()
                .id(p.getId())
                .nomInstitution(p.getNomInstitution())
                .typeInstitution(p.getTypeInstitution())
                .pays(p.getPays())
                .contactPrincipal(p.getContactPrincipal())
                .emailContact(p.getEmailContact())
                .nombreConventions(p.getConventions() != null ? p.getConventions().size() : 0)
                .build();
    }

    public ConventionDTO convertirConventionEnDTO(Convention c) {
        return ConventionDTO.builder()
                .id(c.getId())
                .titre(c.getTitre())
                .dateSignature(c.getDateSignature())
                .dateExpiration(c.getDateExpiration())
                .statut(c.getStatut())
                .partenaire(convertirPartenaireEnDTO(c.getPartenaire()))
                .build();
    }
}
