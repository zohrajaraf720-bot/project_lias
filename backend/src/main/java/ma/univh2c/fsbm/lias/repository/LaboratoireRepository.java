package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Laboratoire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LaboratoireRepository extends JpaRepository<Laboratoire, Long> {
}
