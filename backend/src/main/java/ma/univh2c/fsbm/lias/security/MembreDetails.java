package ma.univh2c.fsbm.lias.security;

import lombok.Getter;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import ma.univh2c.fsbm.lias.enums.StatutMembre;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

@Getter
public class MembreDetails implements UserDetails {

    private final Long id;
    private final String email;
    private final String motDePasse;
    private final String nom;
    private final String prenom;
    private final RoleSysteme roleSysteme;
    private final StatutMembre statut;
    private final EtatCompte etatCompte;
    private final Long equipeId;
    private final String equipeNom;
    private final Boolean doitChangerMotDePasse;
    private final Collection<? extends GrantedAuthority> authorities;

    public MembreDetails(Membre membre, Collection<? extends GrantedAuthority> authorities) {
        this.id = membre.getId();
        this.email = membre.getEmail();
        this.motDePasse = membre.getMotDePasse();
        this.nom = membre.getNom();
        this.prenom = membre.getPrenom();
        this.roleSysteme = membre.getRoleSysteme();
        this.statut = membre.getStatut();
        this.etatCompte = membre.getEtatCompte();
        this.equipeId = membre.getEquipeActuelle() != null ? membre.getEquipeActuelle().getId() : null;
        this.equipeNom = membre.getEquipeActuelle() != null ? membre.getEquipeActuelle().getNom() : null;
        this.doitChangerMotDePasse = Boolean.TRUE.equals(membre.getDoitChangerMotDePasse());
        this.authorities = authorities;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return motDePasse;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return etatCompte == EtatCompte.ACTIF;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return etatCompte == EtatCompte.ACTIF;
    }
}
