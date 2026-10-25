package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.ParticipationEvenement;
import ma.univh2c.fsbm.lias.enums.StatutParticipation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipationEvenementRepository extends JpaRepository<ParticipationEvenement, Long> {
    Optional<ParticipationEvenement> findByMembreIdAndEvenementId(Long membreId, Long evenementId);
    List<ParticipationEvenement> findByEvenementIdAndStatut(Long evenementId, StatutParticipation statut);
    List<ParticipationEvenement> findByMembreId(Long membreId);
}
