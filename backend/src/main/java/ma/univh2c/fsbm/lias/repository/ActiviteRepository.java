package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Activite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ActiviteRepository extends JpaRepository<Activite, Long> {
    List<Activite> findByEquipeId(Long equipeId);
    List<Activite> findByConventionId(Long conventionId);
    List<Activite> findByMembreId(Long membreId);

    @Query("SELECT a FROM Activite a WHERE a.dateDebut BETWEEN :start AND :end")
    List<Activite> findActivitesParPeriode(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
