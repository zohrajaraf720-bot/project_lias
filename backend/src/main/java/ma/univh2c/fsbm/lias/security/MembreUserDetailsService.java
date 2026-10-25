package ma.univh2c.fsbm.lias.security;

import lombok.RequiredArgsConstructor;
import ma.univh2c.fsbm.lias.entity.Mandat;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import ma.univh2c.fsbm.lias.repository.MandatRepository;
import ma.univh2c.fsbm.lias.repository.MembreRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MembreUserDetailsService implements UserDetailsService {

    private final MembreRepository membreRepository;
    private final MandatRepository mandatRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Membre membre = membreRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Membre non trouvé avec l'email: " + email));

        List<GrantedAuthority> authorities = new ArrayList<>();

        if (membre.getRoleSysteme() == RoleSysteme.ADMIN) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        } else {
            if (membre.getStatut() != null) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + membre.getStatut().name()));
            }

            List<Mandat> mandatsActifs = mandatRepository.findByMembreIdAndDateFinIsNull(membre.getId());
            for (Mandat m : mandatsActifs) {
                if (m.estActif()) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + m.getTypeMandat().name()));
                }
            }
        }

        return new MembreDetails(membre, authorities);
    }
}
