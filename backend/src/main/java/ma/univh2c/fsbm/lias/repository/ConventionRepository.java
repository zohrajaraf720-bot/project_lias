package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Convention;
import ma.univh2c.fsbm.lias.enums.StatutConvention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConventionRepository extends JpaRepository<Convention, Long> {
    List<Convention> findByPartenaireId(Long partenaireId);
    List<Convention> findByStatut(StatutConvention statut);

    @Query("SELECT c FROM Convention c WHERE c.statut = ma.univh2c.fsbm.lias.enums.StatutConvention.EN_COURS AND c.dateExpiration < CURRENT_DATE")
    List<Convention> findConventionsExpirees();
}
