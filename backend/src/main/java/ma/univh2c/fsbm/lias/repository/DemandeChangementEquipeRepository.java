package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.DemandeChangementEquipe;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeChangementEquipeRepository extends JpaRepository<DemandeChangementEquipe, Long> {

    List<DemandeChangementEquipe> findByDemandeurIdOrderByDateDemandeDesc(Long demandeurId);

    List<DemandeChangementEquipe> findByStatutOrderByDateDemandeDesc(StatutDemande statut);

    List<DemandeChangementEquipe> findAllByOrderByDateDemandeDesc();

    boolean existsByDemandeurIdAndStatut(Long demandeurId, StatutDemande statut);
}
