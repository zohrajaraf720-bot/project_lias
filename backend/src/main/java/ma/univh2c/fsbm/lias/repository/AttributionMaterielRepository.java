package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.AttributionMateriel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttributionMaterielRepository extends JpaRepository<AttributionMateriel, Long> {
    List<AttributionMateriel> findByMaterielId(Long materielId);
    List<AttributionMateriel> findByMembreId(Long membreId);
    List<AttributionMateriel> findAllByOrderByDateDistributionDesc();
}
