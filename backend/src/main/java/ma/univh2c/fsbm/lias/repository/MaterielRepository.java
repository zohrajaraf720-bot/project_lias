package ma.univh2c.fsbm.lias.repository;

import jakarta.persistence.LockModeType;
import ma.univh2c.fsbm.lias.entity.Materiel;
import ma.univh2c.fsbm.lias.enums.StatutMateriel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterielRepository extends JpaRepository<Materiel, Long> {
    List<Materiel> findByStatut(StatutMateriel statut);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Materiel m WHERE m.id = :id")
    Optional<Materiel> findByIdForUpdate(@Param("id") Long id);
}
