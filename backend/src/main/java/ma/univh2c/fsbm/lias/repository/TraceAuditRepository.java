package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.TraceAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TraceAuditRepository extends JpaRepository<TraceAudit, Long>, JpaSpecificationExecutor<TraceAudit> {
    Page<TraceAudit> findAllByOrderByDateActionDesc(Pageable pageable);
}
