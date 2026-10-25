package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Reunion;
import ma.univh2c.fsbm.lias.enums.StatutReunion;
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
public interface ReunionRepository extends JpaRepository<Reunion, Long>, JpaSpecificationExecutor<Reunion> {
    Page<Reunion> findByStatut(StatutReunion statut, Pageable pageable);

    @Query("SELECT r FROM Reunion r WHERE r.organisateur.id = :membreId OR :membreId IN (SELECT p.id FROM r.participants p)")
    List<Reunion> findReunionsPourMembre(@Param("membreId") Long membreId);

    @Query("SELECT r FROM Reunion r WHERE (r.organisateur.id = :membreId OR :membreId IN (SELECT p.id FROM r.participants p)) AND r.dateReunion BETWEEN :start AND :end")
    List<Reunion> findReunionsPourCalendrier(@Param("membreId") Long membreId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
