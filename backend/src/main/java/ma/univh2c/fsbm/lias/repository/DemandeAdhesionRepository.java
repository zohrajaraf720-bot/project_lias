package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.DemandeAdhesion;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DemandeAdhesionRepository extends JpaRepository<DemandeAdhesion, Long> {
    Page<DemandeAdhesion> findByStatutOrderByDateSoumissionDesc(StatutDemande statut, Pageable pageable);
    Page<DemandeAdhesion> findAllByOrderByDateSoumissionDesc(Pageable pageable);
    Page<DemandeAdhesion> findByStatut(StatutDemande statut, Pageable pageable);
    boolean existsByEmailAndStatut(String email, StatutDemande statut);
    long countByStatut(StatutDemande statut);
}
