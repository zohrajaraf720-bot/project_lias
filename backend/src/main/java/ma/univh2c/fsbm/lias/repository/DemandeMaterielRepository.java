package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.DemandeMateriel;
import ma.univh2c.fsbm.lias.enums.StatutDemandeMateriel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeMaterielRepository extends JpaRepository<DemandeMateriel, Long> {
    List<DemandeMateriel> findByDemandeurId(Long demandeurId);
    Page<DemandeMateriel> findByDemandeurId(Long demandeurId, Pageable pageable);
    Page<DemandeMateriel> findByStatut(StatutDemandeMateriel statut, Pageable pageable);
    long countByStatut(StatutDemandeMateriel statut);
}
