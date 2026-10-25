package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.RapportActivite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RapportActiviteRepository extends JpaRepository<RapportActivite, Long> {
    Optional<RapportActivite> findByAnnee(Integer annee);
    List<RapportActivite> findAllByOrderByAnneeDesc();
}
