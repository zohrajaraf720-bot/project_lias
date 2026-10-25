package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.PeriodeAffiliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PeriodeAffiliationRepository extends JpaRepository<PeriodeAffiliation, Long> {
    Optional<PeriodeAffiliation> findByMembreIdAndDateFinIsNull(Long membreId);
    List<PeriodeAffiliation> findByMembreIdOrderByDateDebutAsc(Long membreId);
}
