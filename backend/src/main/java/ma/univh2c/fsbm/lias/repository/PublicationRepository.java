package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Publication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PublicationRepository extends JpaRepository<Publication, Long>, JpaSpecificationExecutor<Publication> {
    Page<Publication> findByEquipeId(Long equipeId, Pageable pageable);
    @Query("SELECT DISTINCT p FROM Publication p LEFT JOIN p.auteurs a WHERE p.equipe.id = :equipeId OR a.equipeActuelle.id = :equipeId ORDER BY p.annee DESC")
    List<Publication> findByEquipeId(@Param("equipeId") Long equipeId);

    @Query("SELECT p FROM Publication p JOIN p.auteurs a WHERE a.id = :membreId")
    List<Publication> findByAuteurId(@Param("membreId") Long membreId);

    @Query("SELECT p FROM Publication p JOIN p.auteurs a WHERE a.id = :membreId")
    Page<Publication> findByAuteurId(@Param("membreId") Long membreId, Pageable pageable);

    boolean existsByLienDoi(String lienDoi);
}
