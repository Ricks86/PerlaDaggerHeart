package com.daggerheart.vtt.repository;

import com.daggerheart.vtt.model.Armadura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArmaduraRepository extends JpaRepository<Armadura, Long> {}
