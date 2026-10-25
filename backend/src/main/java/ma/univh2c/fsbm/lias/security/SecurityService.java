package ma.univh2c.fsbm.lias.security;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.entity.Document;
import ma.univh2c.fsbm.lias.entity.EvenementScientifique;
import ma.univh2c.fsbm.lias.entity.Reunion;
import ma.univh2c.fsbm.lias.repository.DocumentRepository;
import ma.univh2c.fsbm.lias.repository.EvenementScientifiqueRepository;
import ma.univh2c.fsbm.lias.repository.ReunionRepository;
import ma.univh2c.fsbm.lias.repository.MandatRepository;
import ma.univh2c.fsbm.lias.enums.TypeMandat;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service("securite")
@RequiredArgsConstructor
public class SecurityService {

    private final EvenementScientifiqueRepository evenementRepository;
    private final ReunionRepository reunionRepository;
    private final DocumentRepository documentRepository;
    private final MandatRepository mandatRepository;

    public Long getIdUtilisateurConnecte() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof MembreDetails md) {
            return md.getId();
        }
        return null;
    }

    public boolean estAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    public boolean estDirecteur() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DIRECTEUR"));
    }

    public boolean estViceDirecteur() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_VICE_DIRECTEUR"));
    }

    public boolean estDirecteurOuViceDirecteur() {
        return estDirecteur() || estViceDirecteur();
    }

    public boolean estDirection() {
        return estDirecteur() || estViceDirecteur() || estAdmin();
    }

    public boolean peutGererMandats() {
        // Le Vice-Directeur ne peut JAMAIS créer ou clôturer un mandat (lecture historique uniquement)
        if (estViceDirecteur() && !estDirecteur() && !estAdmin()) {
            return false;
        }
        return estDirecteur() || estAdmin();
    }

    public boolean peutPublierArticle() {
        // L'admin ne peut pas publier d'articles scientifiques car il n'est pas enseignant-chercheur
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        if (estAdmin()) return false;
        return true;
    }

    public boolean estProprietaire(Long membreId) {
        Long currentId = getIdUtilisateurConnecte();
        return currentId != null && (currentId.equals(membreId) || estDirection());
    }

    public boolean estOrganisateurEvenement(Long evenementId) {
        if (estDirection()) return true;
        Long currentId = getIdUtilisateurConnecte();
        if (currentId == null) return false;

        Optional<EvenementScientifique> evt = evenementRepository.findById(evenementId);
        return evt.isPresent() && evt.get().getOrganisateurs().stream().anyMatch(m -> m.getId().equals(currentId));
    }

    public boolean estOrganisateurReunion(Long reunionId) {
        if (estDirection()) return true;
        Long currentId = getIdUtilisateurConnecte();
        if (currentId == null) return false;

        Optional<Reunion> r = reunionRepository.findById(reunionId);
        return r.isPresent() && r.get().getOrganisateur().getId().equals(currentId);
    }

    public boolean estParticipantOuOrganisateurReunion(Long reunionId) {
        if (estDirection()) return true;
        Long currentId = getIdUtilisateurConnecte();
        if (currentId == null) return false;

        Optional<Reunion> r = reunionRepository.findById(reunionId);
        if (r.isEmpty()) return false;
        Reunion reunion = r.get();
        if (reunion.getOrganisateur().getId().equals(currentId)) return true;
        return reunion.getParticipants().stream().anyMatch(m -> m.getId().equals(currentId));
    }

    public boolean estAuteurDocument(Long documentId) {
        if (estDirection()) return true;
        Long currentId = getIdUtilisateurConnecte();
        if (currentId == null) return false;

        Optional<Document> doc = documentRepository.findById(documentId);
        return doc.isPresent() && doc.get().getAuteur().getId().equals(currentId);
    }

    public boolean estChefDeLEquipe(Long equipeId) {
        if (estDirection()) return true;
        Long currentId = getIdUtilisateurConnecte();
        if (currentId == null || equipeId == null) return false;
        return mandatRepository.findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat.CHEF_EQUIPE, equipeId)
                .map(m -> m.getMembre() != null && m.getMembre().getId().equals(currentId))
                .orElse(false);
    }
}
