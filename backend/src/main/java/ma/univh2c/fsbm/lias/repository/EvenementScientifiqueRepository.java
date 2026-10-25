package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.EvenementScientifique;
import ma.univh2c.fsbm.lias.enums.StatutEvenement;
import ma.univh2c.fsbm.lias.enums.StatutValidationEvenement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EvenementScientifiqueRepository extends JpaRepository<EvenementScientifique, Long>, JpaSpecificationExecutor<EvenementScientifique> {
    Page<EvenementScientifique> findByStatut(StatutEvenement statut, Pageable pageable);
    List<EvenementScientifique> findByStatut(StatutEvenement statut);
    List<EvenementScientifique> findByStatutValidation(StatutValidationEvenement statutValidation);

    @Query("SELECT e FROM EvenementScientifique e WHERE e.statutValidation = ma.univh2c.fsbm.lias.enums.StatutValidationEvenement.VALIDE AND e.dateDebut <= :end AND e.dateFin >= :start")
    List<EvenementScientifique> findEvenementsPourCalendrier(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT e FROM EvenementScientifique e WHERE e.statut = ma.univh2c.fsbm.lias.enums.StatutEvenement.ARCHIVE ORDER BY e.type, e.edition")
    List<EvenementScientifique> findArchivesGroupes();
}
