package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Document;
import ma.univh2c.fsbm.lias.enums.TypeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {
    List<Document> findByEvenementId(Long evenementId);
    List<Document> findByConventionId(Long conventionId);
    List<Document> findByTypeDocument(TypeDocument typeDocument);
    List<Document> findByTitreContainingIgnoreCase(String titre);
}
