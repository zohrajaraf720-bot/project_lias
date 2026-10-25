package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Mandat;
import ma.univh2c.fsbm.lias.enums.TypeMandat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MandatRepository extends JpaRepository<Mandat, Long> {
    List<Mandat> findByMembreId(Long membreId);
    List<Mandat> findByTypeMandatAndDateFinIsNull(TypeMandat typeMandat);
    Optional<Mandat> findByTypeMandatAndEquipeIdAndDateFinIsNull(TypeMandat typeMandat, Long equipeId);
    Optional<Mandat> findFirstByTypeMandatAndDateFinIsNull(TypeMandat typeMandat);

    @Query("SELECT m FROM Mandat m WHERE m.dateFin IS NOT NULL OR m.dateFin < CURRENT_DATE ORDER BY m.dateDebut DESC")
    List<Mandat> findHistoriqueMandats();

    List<Mandat> findByMembreIdAndDateFinIsNull(Long membreId);
}
