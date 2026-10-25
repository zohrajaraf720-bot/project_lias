package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.MessageLecture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MessageLectureRepository extends JpaRepository<MessageLecture, Long> {
    boolean existsByMessageIdAndMembreId(Long messageId, Long membreId);
}
