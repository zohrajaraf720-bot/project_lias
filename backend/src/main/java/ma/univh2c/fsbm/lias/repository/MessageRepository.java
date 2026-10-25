package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByCanalIdOrderByDateEnvoiAsc(Long canalId);
    Page<Message> findByCanalIdOrderByDateEnvoiDesc(Long canalId, Pageable pageable);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.canal.id = :canalId AND m.id NOT IN (SELECT ml.message.id FROM MessageLecture ml WHERE ml.membre.id = :membreId)")
    Long countMessagesNonLus(@Param("canalId") Long canalId, @Param("membreId") Long membreId);
}
