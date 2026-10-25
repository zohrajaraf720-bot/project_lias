package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Notification;
import ma.univh2c.fsbm.lias.enums.TypeNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDestinataireId(Long membreId);
    List<Notification> findByDestinataireIdOrderByDateCreationDesc(Long membreId);
    Page<Notification> findByDestinataireIdOrderByDateCreationDesc(Long membreId, Pageable pageable);
    Page<Notification> findByDestinataireIdAndTypeOrderByDateCreationDesc(Long membreId, TypeNotification type, Pageable pageable);
    long countByDestinataireIdAndEstLueFalse(Long membreId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.estLue = true WHERE n.destinataire.id = :membreId AND (:type IS NULL OR n.type = :type)")
    void marquerToutCommeLu(@Param("membreId") Long membreId, @Param("type") TypeNotification type);
}
