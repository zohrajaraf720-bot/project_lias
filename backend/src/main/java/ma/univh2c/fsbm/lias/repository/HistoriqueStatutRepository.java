package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.HistoriqueStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueStatutRepository extends JpaRepository<HistoriqueStatut, Long> {
    List<HistoriqueStatut> findByMembreIdOrderByDateChangementAsc(Long membreId);
}
