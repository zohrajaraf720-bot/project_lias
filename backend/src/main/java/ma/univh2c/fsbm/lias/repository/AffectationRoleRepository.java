package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.AffectationRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AffectationRoleRepository extends JpaRepository<AffectationRole, Long> {
    Optional<AffectationRole> findByMembreIdAndDateFinIsNull(Long membreId);
    List<AffectationRole> findByMembreId(Long membreId);
    List<AffectationRole> findByEquipeIdAndDateFinIsNull(Long equipeId);
}
