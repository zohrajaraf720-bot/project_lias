package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.DemandeModificationEquipe;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeModificationEquipeRepository extends JpaRepository<DemandeModificationEquipe, Long> {

    List<DemandeModificationEquipe> findByEquipeIdOrderByDateDemandeDesc(Long equipeId);

    List<DemandeModificationEquipe> findByStatutOrderByDateDemandeDesc(StatutDemande statut);

    List<DemandeModificationEquipe> findAllByOrderByDateDemandeDesc();

    boolean existsByEquipeIdAndStatut(Long equipeId, StatutDemande statut);
}
