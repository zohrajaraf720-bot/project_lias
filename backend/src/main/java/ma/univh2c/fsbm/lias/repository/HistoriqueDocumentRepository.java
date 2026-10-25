package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.HistoriqueDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueDocumentRepository extends JpaRepository<HistoriqueDocument, Long> {
    List<HistoriqueDocument> findByDocumentIdOrderByVersionArchiveeDesc(Long documentId);
}
