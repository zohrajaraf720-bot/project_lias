package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.CanalDiscussion;
import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.enums.TypeCanal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CanalDiscussionRepository extends JpaRepository<CanalDiscussion, Long> {
    Optional<CanalDiscussion> findByEquipeId(Long equipeId);
    Optional<CanalDiscussion> findByEvenementId(Long evenementId);
    List<CanalDiscussion> findByTypeCanal(TypeCanal typeCanal);

    @Query("SELECT c FROM CanalDiscussion c JOIN c.participants p WHERE p.id = :membreId")
    List<CanalDiscussion> findCanauxPourMembre(@Param("membreId") Long membreId);

    @Query("SELECT c FROM CanalDiscussion c WHERE c.typeCanal = ma.univh2c.fsbm.lias.enums.TypeCanal.DIRECT AND :m1 MEMBER OF c.participants AND :m2 MEMBER OF c.participants")
    Optional<CanalDiscussion> findCanalDirect(@Param("m1") Membre m1, @Param("m2") Membre m2);
}
