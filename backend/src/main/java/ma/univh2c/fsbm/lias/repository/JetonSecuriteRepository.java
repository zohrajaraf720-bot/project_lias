package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.JetonSecurite;
import ma.univh2c.fsbm.lias.enums.TypeJeton;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface JetonSecuriteRepository extends JpaRepository<JetonSecurite, Long> {
    Optional<JetonSecurite> findByHashJetonAndType(String hashJeton, TypeJeton type);

    @Modifying
    @Transactional
    @Query("UPDATE JetonSecurite j SET j.revoque = true WHERE j.membre.id = :membreId")
    void revoquerTousJetonsDuMembre(@Param("membreId") Long membreId);

    @Modifying
    @Transactional
    @Query("DELETE FROM JetonSecurite j WHERE j.dateExpiration < CURRENT_TIMESTAMP OR j.revoque = true OR j.utilise = true")
    void purgerJetonsExpires();
}
